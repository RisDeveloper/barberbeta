import { guard } from "@/lib/guard"; import POS from "./pos";
export default async function NewTx() { await guard("CASHIER"); return (<><h1>Transaksi Baru</h1><POS /></>); }
