import React from 'react';
import type {
    WidgetConfig,
    OrderDetailsWidgetProps,
} from "@medusajs/admin";

const ProductWidget = ({
    order,
    notify,
}: OrderDetailsWidgetProps) => {
    const handlePrint = () => {
        const printWindow = window.open('', '', 'height=600,width=400');
        printWindow?.document.write(`
            <html>
            <head>
                <title>Print Order</title>
                <style>
                    body {
                        font-family: 'Courier New', monospace;
                        margin: 0;
                        padding: 20px;
                        background-color: #f0f0f0;
                    }
                    .receipt {
                        background-color: white;
                        width: 300px;
                        margin: 0 auto;
                        padding: 20px;
                        box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        border-bottom: 2px dashed #000;
                        padding-bottom: 10px;
                        margin-bottom: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .order-details, .items, .totals {
                        margin-bottom: 20px;
                    }
                    .item {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 5px;
                    }
                    .total {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                    }
                    .footer {
                        text-align: center;
                        border-top: 2px dashed #000;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="receipt">
                    <div class="header">
                        <div class="logo">Cheezy Wrap</div>
                        <div>Order Receipt</div>
                    </div>
                    <div class="order-details">
                        <p><strong>Order ID:</strong> ${order.display_id}</p>
                        <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Payment Status:</strong> ${order.payment_status}</p>
                    </div>
                    <div class="items">
                        <h3>Order Items:</h3>
                        ${order.items.map(item => `
                            <div class="item">
                                <span>${item.title} x${item.quantity}</span>
                                <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="totals">
                        <div class="total">
                            <span>Subtotal:</span>
                            <span>${(order.subtotal).toFixed(2)}</span>
                        </div>
                        <div class="total">
                            <span>Tax:</span>
                            <span>${(order.tax_total).toFixed(2)}</span>
                        </div>
                        <div class="total">
                            <span>Total:</span>
                            <span>${(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Thank you for your order!</p>
                        <p>contact@cheezy-wrap.com</p>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow?.document.close();
        printWindow?.focus();
        printWindow?.print();
    };

    return (
        <div className="bg-white p-8 border border-gray-200 rounded-lg flex justify-between items-center">
            <h1 className="text-2xl font-bold mb-4">Order Details</h1>

            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                onClick={handlePrint}
            >
                Print Receipt
            </button>

          
        </div>
    );
};

export const config: WidgetConfig = {
    zone: "order.details.before",
};

export default ProductWidget;