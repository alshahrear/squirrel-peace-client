import { useRef, useState } from "react";
import Customer from "./Customer";
import ReceiptPage from "./ReceiptPage";

const InvoicePage = () => {
  const receiptRef = useRef(null);
  const [customerData, setCustomerData] = useState(null);

  const handleNext = (data) => {
    setCustomerData(data);

    setTimeout(() => {
      receiptRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div>

      <Customer onNext={handleNext} />

      <div ref={receiptRef}>
        <ReceiptPage customerData={customerData} />
      </div>

    </div>
  );
};

export default InvoicePage;