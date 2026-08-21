import { OrderDetail } from "@/components/account/order-detail";
export const metadata = { title: "Order Details" };
export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) { const { orderId } = await params; return <OrderDetail orderId={orderId} />; }
