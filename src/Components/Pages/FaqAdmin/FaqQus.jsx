import { LuMessageCircleX } from "react-icons/lu";
import Swal from "sweetalert2";

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
            confirmButtonText: "Yes, delete it!"
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://localhost:5000/faqs/${_id}`, {
                    method: 'DELETE',
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            // ✅ Remove deleted FAQ from state
                            const remainingFaqs = faqs.filter(item => item._id !== _id);
                            setFaqs(remainingFaqs);

                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: `${name}'s faq question has been deleted`,
                                showConfirmButton: false,
                                timer: 1500
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

export default FaqQus;
