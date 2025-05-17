import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";

const Faq = () => {
  const handlefaq = (e) => {
    e.preventDefault();
    const form = e.target;

    const name = form.name.value;
    const email = form.email.value;
    const question = form.question.value;
    const addfaq = { name, email, question };

    fetch("http://localhost:5000/faqs", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(addfaq),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.insertedId) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title:
              "Thanks for your question! Our team will check it and reply to your email shortly.",
            showConfirmButton: false,
            timer: 2500,
          });
          form.reset();
        }
      });
  };

  return (
    <div className="my-12 max-w-screen-xl mx-auto px-4">
      {/* Header with Button */}
      <div className="flex items-center justify-between flex-wrap mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          Frequently Asked Questions <span className="text-[#2acb35]">__</span>
        </h1>
        <NavLink to="/faqAdmin">
          <button className="relative overflow-hidden px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
              Faq Admin Page
            </span>
            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
          </button>
        </NavLink>
      </div>

      <p className="text-lg font-medium my-5">
        Discover your question from underneath or present your inquiry from the submit box.
      </p>

      <div className="flex flex-wrap">
        <style jsx>{`
          input:checked ~ .collapse-title {
            background-color: #2acb35;
            color: white;
          }
          input:checked ~ .collapse-content {
            background-color: #f7f7f7;
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }
        `}</style>

        {/* FAQ Section */}
        <div className="w-full md:w-2/3 pr-0 md:pr-4">
          <div className="collapse collapse-arrow bg-base-100 border border-base-300">
            <input type="radio" name="my-accordion-2" defaultChecked />
            <div className="collapse-title text-lg font-semibold">
              What is Squirrel Peace?
            </div>
            <div className="collapse-content text-lg font-medium">
              Squirrel Peace is a creative platform offering unique handmade and digital art products designed to bring calm and beauty to your space.
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title text-lg font-semibold">
              How can I place an order?
            </div>
            <div className="collapse-content text-lg font-medium">
              Simply browse our catalog, add items to your cart, and proceed to checkout using your preferred payment method.
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title text-lg font-semibold">
              Do you offer custom artwork?
            </div>
            <div className="collapse-content text-lg font-medium">
              Yes! We accept custom orders. You can contact us with your idea and we'll work with you to bring it to life.
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title text-lg font-semibold">
              What is your return policy?
            </div>
            <div className="collapse-content text-lg font-medium">
              We accept returns within 7 days of delivery for damaged or incorrect products. Please read our full return policy before placing your order.
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 border border-base-300 mt-2">
            <input type="radio" name="my-accordion-2" />
            <div className="collapse-title text-lg font-semibold">
              How can I contact your support team?
            </div>
            <div className="collapse-content text-lg font-medium">
              You can reach us through our contact form or email us directly at support@squirrelpeace.com. We typically respond within 24 hours.
            </div>
          </div>
          <button
              className="btn mt-5 px-6 py-5 text-lg font-medium rounded-lg text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]"
            >
              Add Faq
            </button>
        </div>

        {/* Question Submission Form */}
        <div className="w-full md:w-1/3 mt-8 md:mt-0 p-6 border border-gray-200 rounded-lg bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Didn't find your answer? <br /> Submit your question <span className="text-[#2acb35]">__</span>
          </h2>
          <form onSubmit={handlefaq} className="space-y-4">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Your Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Your Question</label>
              <textarea
                rows="4"
                name="question"
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Type your question here..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn px-6 py-5 text-lg font-medium rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]"
            >
              Submit Now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Faq;
