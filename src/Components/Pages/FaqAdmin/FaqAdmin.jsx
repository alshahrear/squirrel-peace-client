import { useEffect, useState } from "react";
import FaqQus from "./FaqQus";
import { NavLink } from "react-router-dom";

const FaqAdmin = () => {
    const [faqs, setFaqs] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/faqs')
            .then(res => res.json())
            .then(data => setFaqs(data))
            .catch(error => console.error("Error loading FAQs:", error));
    }, []);

    return (
        <div className="my-12 max-w-screen-xl mx-auto px-4">
            <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl font-bold">
                    Welcome <i className="text-[#2acb35]">Shishir Rayhan</i> to the FAQ Administration Panel
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                    This is a list of users who couldn't find their question in our FAQ section and decided to submit their own. <br />
                    Here are their submitted questions.
                </p>
                <NavLink to="/faq">
                    <button className="relative overflow-hidden px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                            Go To Faq Page
                        </span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </NavLink>
            </div>

            <div className="mb-4 text-right pr-3 text-2xl font-semibold text-gray-800">
                Total Question: <span className="text-[#2acb35]">{faqs.length}</span>
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="table-auto w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#2acb35] text-white text-xl">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Question</th>
                            <th className="py-3 px-4 text-center">Check</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {
                            faqs.length > 0 ? (
                                faqs.map((faq, index) => (
                                    <FaqQus
                                        key={faq._id}
                                        faq={faq}
                                        index={index}
                                        setFaqs={setFaqs}
                                        faqs={faqs}
                                    />
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-6 text-gray-500">
                                        No submitted questions found.
                                    </td>
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FaqAdmin;
