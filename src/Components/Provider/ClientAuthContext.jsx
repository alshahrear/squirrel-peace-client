import { createContext, useContext, useState, useEffect } from "react";

const ClientAuthContext = createContext(null);


export const ClientAuthProvider = ({ children }) => {
  const [clientUser, setClientUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true); // নতুন যোগ করা হলো

  // পেজ লোড বা রিফ্রেশ হলে লোকালস্টোরেজ থেকে ডেটা লোড করা
  const fetchClientUser = () => {
    const storedUser = localStorage.getItem("clientUser");
    if (storedUser) {
      try {
        setClientUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse client user from localStorage", error);
        setClientUser(null);
      }
    } else {
      setClientUser(null);
    }
    setIsChecking(false); // লোড হওয়া শেষ
  };

  useEffect(() => {
    fetchClientUser();

    // অন্য কোনো ট্যাব বা কম্পোনেন্ট থেকে আপডেট হলে তা রিসিভ করার জন্য
    window.addEventListener("clientUserUpdated", fetchClientUser);
    window.addEventListener("storage", fetchClientUser);

    // ব্যাকএন্ড থেকে লাইভ ডাটা চেক ও সিঙ্ক করা
    const checkLoginStatus = async () => {
      const storedUser = localStorage.getItem("clientUser");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          if (user && user._id) {
            const response = await fetch(`http://localhost:5000/client?t=${Date.now()}`, {
              cache: 'no-store'
            });
            const clients = await response.json();
            const currentClient = clients.find(c => c._id === user._id);

            if (!currentClient || currentClient.isActive !== true) {
              localStorage.removeItem("clientUser");
              setClientUser(null);
              window.dispatchEvent(new Event("clientUserUpdated"));
            } else {
              // লেটেস্ট ডাটা সিঙ্ক করে স্টেট ও লোকালস্টোরেজ আপডেট করা যাতে রিফ্রেশ ছাড়াই সাথে সাথে দেখায়
             // ব্যাকএন্ড থেকে যদি স্ট্যাটাস 'no' করে দেওয়া হয় (ফোর্সড লগআউট), তবে ক্লায়েন্টকে লগআউট করিয়ে দেওয়া
              if (currentClient.login === 'no') {
                localStorage.removeItem("clientUser");
                localStorage.removeItem("clientToken");
                setClientUser(null);
                window.dispatchEvent(new Event("clientUserUpdated"));
              } else {
                // লেটেস্ট ডাটা সিঙ্ক করে স্টেট ও লোকালস্টোরেজ আপডেট করা যাতে রিফ্রেশ ছাড়াই সাথে সাথে দেখায়
                const updatedSessionUser = { ...user, ...currentClient };
                localStorage.setItem("clientUser", JSON.stringify(updatedSessionUser));
                setClientUser(updatedSessionUser);
              }
            }
          }
        } catch (error) {
          console.error("Failed to check live status", error);
        }
      }
    };

    const interval = setInterval(checkLoginStatus, 1000);

    return () => {
      window.removeEventListener("clientUserUpdated", fetchClientUser);
      window.removeEventListener("storage", fetchClientUser);
      clearInterval(interval);
    };
  }, []);

  // লগআউট ফাংশন
  const clientLogout = async () => {
    if (clientUser && clientUser._id) {
      try {
        await fetch(`http://localhost:5000/client/login-status/${clientUser._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: 'no' })
        });
      } catch (error) {
        console.error("Failed to update logout status on backend", error);
      }
    }
    localStorage.removeItem("clientUser");
    localStorage.removeItem("clientToken"); // টোকেনও রিমুভ করে দেওয়া হলো
    setClientUser(null);
    window.dispatchEvent(new Event("clientUserUpdated"));
  };

  return (
    <ClientAuthContext.Provider value={{ clientUser, setClientUser, clientLogout, isChecking }}>
      {children}
    </ClientAuthContext.Provider>
  );
};

// কাস্টম হুক যাতে খুব সহজেই ডেটা ব্যবহার করা যায়
export const useClientAuth = () => {
  return useContext(ClientAuthContext);
};