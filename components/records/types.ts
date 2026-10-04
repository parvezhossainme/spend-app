import type { TransactionDTO } from "@/lib/services/transactions";
import type { TransferDTO } from "@/lib/services/transfers";

export type AccountOption = {
  id: string;
  name: string;
  type: string;
  currencyCode: string;
  icon: string;
  color: string;
};

export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
};

export type LedgerInitial =
  | { kind: "transaction"; data: TransactionDTO }
  | { kind: "transfer"; data: TransferDTO }
  | null;

export type LedgerItem =
  | { kind: "transaction"; id: string; date: string; data: TransactionDTO }
  | { kind: "transfer"; id: string; date: string; data: TransferDTO };
