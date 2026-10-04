import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/actions/result";
import { toDecimal, toDisplayString } from "@/lib/finance/money";
import { parseIsoDate } from "@/lib/finance/dates";
import type { TransferInput } from "@/lib/validations/transaction";

export type TransferDTO = {
  id: string;
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  exchangeRate: string;
  transactionDate: string;
  note: string | null;
  fromAccount: { id: string; name: string; icon: string; color: string };
  toAccount: { id: string; name: string; icon: string; color: string };
};

const transferInclude = {
  fromAccount: { select: { id: true, name: true, icon: true, color: true } },
  toAccount: { select: { id: true, name: true, icon: true, color: true } },
} satisfies Prisma.TransferInclude;

type TransferWithRelations = Prisma.TransferGetPayload<{ include: typeof transferInclude }>;

export function serializeTransfer(transfer: TransferWithRelations): TransferDTO {
  return {
    id: transfer.id,
    fromAmount: toDisplayString(transfer.fromAmount),
    fromCurrency: transfer.fromCurrency,
    toAmount: toDisplayString(transfer.toAmount),
    toCurrency: transfer.toCurrency,
    exchangeRate: transfer.exchangeRate.toString(),
    transactionDate: transfer.transactionDate.toISOString(),
    note: transfer.note,
    fromAccount: transfer.fromAccount,
    toAccount: transfer.toAccount,
  };
}

export async function listTransfers(
  userId: string,
  range?: { from?: Date; to?: Date; accountId?: string },
): Promise<TransferDTO[]> {
  const where: Prisma.TransferWhereInput = { userId };
  if (range?.from || range?.to) {
    where.transactionDate = {};
    if (range.from) where.transactionDate.gte = range.from;
    if (range.to) where.transactionDate.lt = range.to;
  }
  if (range?.accountId) {
    where.OR = [{ fromAccountId: range.accountId }, { toAccountId: range.accountId }];
  }

  const transfers = await prisma.transfer.findMany({
    where,
    include: transferInclude,
    orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
  });

  return transfers.map(serializeTransfer);
}

export async function getTransfer(userId: string, id: string): Promise<TransferDTO | null> {
  const transfer = await prisma.transfer.findFirst({ where: { id, userId }, include: transferInclude });
  return transfer ? serializeTransfer(transfer) : null;
}

async function assertAccounts(userId: string, fromAccountId: string, toAccountId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, id: { in: [fromAccountId, toAccountId] } },
    select: { id: true, currencyCode: true, isActive: true },
  });

  const from = accounts.find((account) => account.id === fromAccountId);
  const to = accounts.find((account) => account.id === toAccountId);
  if (!from) throw new DomainError("Source account not found.");
  if (!to) throw new DomainError("Destination account not found.");
  return { from, to };
}

export async function createTransfer(userId: string, input: TransferInput): Promise<TransferDTO> {
  const { from, to } = await assertAccounts(userId, input.fromAccountId, input.toAccountId);

  const fromAmount = toDecimal(input.fromAmount);
  const crossCurrency = from.currencyCode !== to.currencyCode;

  let exchangeRate = toDecimal(1);
  let toAmount = toDecimal(input.toAmount);

  if (crossCurrency) {
    exchangeRate = toDecimal(input.exchangeRate || toAmount.div(fromAmount));
    if (exchangeRate.lessThanOrEqualTo(0)) throw new DomainError("Currency conversion rate is invalid.");
  } else {
    exchangeRate = toDecimal(1);
    toAmount = fromAmount;
  }

  const date = parseIsoDate(input.transactionDate);
  if (!date) throw new DomainError("Invalid transfer date.");

  const transfer = await prisma.transfer.create({
    data: {
      userId,
      fromAccountId: from.id,
      toAccountId: to.id,
      fromAmount,
      fromCurrency: from.currencyCode,
      toAmount,
      toCurrency: to.currencyCode,
      exchangeRate,
      transactionDate: date,
      note: input.note?.trim() || null,
    },
    include: transferInclude,
  });

  return serializeTransfer(transfer);
}

export async function updateTransfer(userId: string, id: string, input: TransferInput): Promise<TransferDTO> {
  const existing = await prisma.transfer.findFirst({ where: { id, userId }, select: { id: true } });
  if (!existing) throw new DomainError("Transfer not found.");

  const { from, to } = await assertAccounts(userId, input.fromAccountId, input.toAccountId);
  const fromAmount = toDecimal(input.fromAmount);
  const crossCurrency = from.currencyCode !== to.currencyCode;

  let exchangeRate = toDecimal(1);
  let toAmount = toDecimal(input.toAmount);

  if (crossCurrency) {
    exchangeRate = toDecimal(input.exchangeRate || toAmount.div(fromAmount));
    if (exchangeRate.lessThanOrEqualTo(0)) throw new DomainError("Currency conversion rate is invalid.");
  } else {
    toAmount = fromAmount;
  }

  const date = parseIsoDate(input.transactionDate);
  if (!date) throw new DomainError("Invalid transfer date.");

  const transfer = await prisma.transfer.update({
    where: { id },
    data: {
      fromAccountId: from.id,
      toAccountId: to.id,
      fromAmount,
      fromCurrency: from.currencyCode,
      toAmount,
      toCurrency: to.currencyCode,
      exchangeRate,
      transactionDate: date,
      note: input.note?.trim() || null,
    },
    include: transferInclude,
  });

  return serializeTransfer(transfer);
}

export async function deleteTransfer(userId: string, id: string): Promise<void> {
  const result = await prisma.transfer.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new DomainError("Transfer not found.");
}
