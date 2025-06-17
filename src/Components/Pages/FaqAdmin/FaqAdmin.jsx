import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LuMessageCircleX } from "react-icons/lu";
import Swal from "sweetalert2";
import useAuth from "../../Layout/useAuth";
import { Helmet } from "react-helmet";

const FaqAdmin = () => {
    const [faqs, setFaqs] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        fetch("http://localhost:5000/faqs")
            .then((res) => res.json())
            .then((data) => setFaqs(data))
            .catch((error) => console.error("Error loading FAQs:", error));
    }, []);

    return (
        <div className="my-12 max-w-screen-xl mx-auto px-4">
            <Helmet>
                <title>FaqAdmin - Storial Peace</title>
            </Helmet>
            <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl font-bold">
                    Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the FAQ
                    Administration Panel
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                    This is a list of users who couldn't find their question in our FAQ
                    section and decided to submit their own. <br />
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
                        {faqs.length > 0 ? (
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
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FaqQus = ({ faq, index, setFaqs, faqs }) => {
    const { _id, name, email, question } = faq;

    const handleFaqDelete = () => {
        Swal.fire({
            title: "Are you sure to delete it?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2acb35",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://localhost:5000/faqs/${_id}`, {
                    method: "DELETE",
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.deletedCount > 0) {
                            // ✅ Remove deleted FAQ from state
                            const remainingFaqs = faqs.filter((item) => item._id !== _id);
                            setFaqs(remainingFaqs);

                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: `${name}'s faq question has been deleted`,
                                showConfirmButton: false,
                                timer: 1500,
                            });
                        }
                    });
            }
        });
    };

    return (
        <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200">
            <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
            <td className="py-4 px-4 text-lg font-bold text-gray-800">{name}</td>
            <td className="py-4 px-4 text-lg text-gray-700">{email}</td>
            <td className="py-4 px-4 text-lg text-gray-700 w-2/4">{question}</td>
            <td className="py-4 px-4 text-center">
                <button
                    onClick={handleFaqDelete}
                    className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
                >
                    <LuMessageCircleX className="text-2xl" />
                </button>
            </td>
        </tr>
    );
};

export default FaqAdmin;
