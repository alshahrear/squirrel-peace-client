import { useState } from "react";
import { FaMobileAlt, FaMapMarkerAlt, FaChild, FaEnvelope, FaCopy } from "react-icons/fa";
import { HiOutlineUser } from "react-icons/hi";

const paymentNumbers = {
  bkash: { number: "01612002913", label: "Send Money" },
  nagad: { number: "01877908888", label: "Send Money" },
  rocket: { number: "016120029134", label: "Send Money" },
};

const subscriptionOptions = [
  { months: 1, label: "1 Month", price: 999 },
  { months: 2, label: "2 Months", price: 1800 },
  { months: 3, label: "3 Months", price: 2600 },
  { months: 6, label: "6 Months", price: 5000 },
  { months: 12, label: "12 Months", price: 9500 },
];

const LetterPayment = () => {
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [selectedOption, setSelectedOption] = useState(subscriptionOptions[0]);
  const [coupon, setCoupon] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [childInterest, setChildInterest] = useState("");
  const [lastDigits, setLastDigits] = useState("");
  const [agree, setAgree] = useState(false);
  const [copied, setCopied] = useState(false);

  const originalTotal = selectedOption.months * 999;
  const savePercentage = Math.floor(((originalTotal - selectedOption.price) / originalTotal) * 100);

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentNumbers[paymentMethod].number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isFormValid =
    name &&
    mobile.length > 0 &&
    /^[0-9]+$/.test(mobile) &&
    address &&
    childName &&
    childAge &&
    /^\d{3}$/.test(lastDigits) &&
    agree;

  return (
    <div className="py-10 max-w-screen-xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-3">Subscribe to Monthly Learning Letters</h2>
      <p className="text-center text-gray-600 mb-8">
        Get 4 printed story letters per month for your child. Screen-free learning and fun delivered to your home!
      </p>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Card */}
        <div className="md:col-span-1 bg-green-50 p-5 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-3">📦 Your Subscription</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ 4 Weekly Printed Letters</li>
            <li>✅ Personalized with Child's Name</li>
            <li>✅ Moral-based Stories + Activities</li>
            <li>✅ Chance to Win Monthly Prizes</li>
            <li>✅ Free Home Delivery</li>
            <li>📅 Duration: <strong>{selectedOption.label}</strong></li>
            {savePercentage > 0 && (
              <li className="text-[#2acb35]">🎁 {savePercentage}% Save</li>
            )}
            <li className="pt-3 border-t">
              <strong>Total: ৳{selectedOption.price}</strong>
            </li>
          </ul>
        </div>

        {/* Right Form */}
        <div className="md:col-span-2 bg-white p-5 rounded-xl shadow space-y-5">
          <h3 className="text-xl font-semibold mb-4">📝 Billing Information</h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center border border-gray-300 p-2 rounded">
              <HiOutlineUser className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-gray-300 p-2 rounded">
              <FaMobileAlt className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Mobile Number"
                value={mobile}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setMobile(onlyDigits);
                }}
              />
            </div>

            <div className="flex items-center border border-gray-300 p-2 rounded">
              <FaMapMarkerAlt className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Delivery Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-gray-300 p-2 rounded">
              <FaChild className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Child's Name"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-gray-300 p-2 rounded">
              <FaEnvelope className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="number"
                placeholder="Child’s Age"
                value={childAge}
                onChange={(e) => setChildAge(e.target.value)}
              />
            </div>

            <div className="flex items-center border border-gray-300 p-2 rounded">
              <FaEnvelope className="text-gray-500 mr-2" />
              <input
                className="w-full outline-none"
                type="text"
                placeholder="Child's Interest (optional)"
                value={childInterest}
                onChange={(e) => setChildInterest(e.target.value)}
              />
            </div>
          </div>

          {/* Subscription Duration & Coupon */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <h4 className="text-lg font-medium mb-2">📅 Subscription Duration</h4>
              <select
                value={selectedOption.months}
                onChange={(e) =>
                  setSelectedOption(subscriptionOptions.find(opt => opt.months === Number(e.target.value)))
                }
                className="w-full border border-gray-300 p-2 rounded"
              >
                {subscriptionOptions.map((opt) => {
                  const original = opt.months * 999;
                  const percent = Math.floor(((original - opt.price) / original) * 100);
                  return (
                    <option key={opt.months} value={opt.months}>
                      {opt.label} - ৳{opt.price} {percent > 0 ? `(${percent}% Save)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex-1">
              <h4 className="text-lg font-medium mb-2">🎟️ Have a Coupon?</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Enter Coupon Code (Optional)"
                  className="w-full border border-gray-300 p-2 rounded"
                />
                <button className="bg-[#2acb35] text-white px-4 rounded">Apply</button>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div>
            <h4 className="text-lg font-medium mb-2">💳 Choose Payment Method</h4>
            <div className="flex gap-4 flex-wrap mb-3">
              {["bkash", "nagad", "rocket"].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`px-4 py-2 border border-gray-300 rounded ${
                    paymentMethod === method ? "bg-[#2acb35] text-white" : "bg-gray-100"
                  }`}
                >
                  {method.charAt(0).toUpperCase() + method.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-center ">
              <div className="flex text-lg items-center gap-1">
                <span>
                  Send Money to: <strong>{paymentNumbers[paymentMethod].number}</strong>
                </span>
                <FaCopy
                  onClick={handleCopy}
                  className="cursor-pointer text-gray-600 hover:text-black"
                  title="Copy Number"
                />
                <span className="text-gray-700 ml-1">
                  ({paymentNumbers[paymentMethod].label})
                </span>
              </div>

              <input
                type="text"
                maxLength={3}
                placeholder="Last 3 digits of your payment number"
                value={lastDigits}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, "");
                  setLastDigits(onlyDigits);
                }}
                className="border border-gray-300 p-2 rounded w-72"
              />
            </div>

            {copied && <p className="text-[#2acb35] mt-1">Number copied!</p>}
          </div>

          {/* Terms and Pay */}
          <div className="space-y-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              I agree to the{" "}
              <a href="#" className="underline">
                terms and conditions
              </a>{" "}
              and understand this is a monthly subscription.
            </label>

            <button
              className={`w-full py-3 rounded-xl text-lg font-semibold ${
                isFormValid
                  ? "bg-[#2acb35] text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!isFormValid}
            >
              Complete Payment of ৳{selectedOption.price}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LetterPayment;
