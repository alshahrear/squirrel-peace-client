// import { LuMessageCircleX } from "react-icons/lu";
// import { TbMessageCheck } from "react-icons/tb";
// import { useState } from "react";
// import Swal from "sweetalert2";

// const ContactMessage = ({ contact, index, setContacts, contacts }) => {
//     const { _id, name, email, phone, subject, message } = contact;

//     const [showModal, setShowModal] = useState(false);

//     const handleContactDelete = () => {
//         Swal.fire({
//             title: "Are you sure to delete it?",
//             text: "You won't be able to revert this!",
//             icon: "warning",
//             showCancelButton: true,
//             confirmButtonColor: "#2acb35",
//             cancelButtonColor: "#d33",
//             confirmButtonText: "Yes, delete it!"
//         }).then((result) => {
//             if (result.isConfirmed) {
//                 fetch(`http://localhost:5000/contact/${_id}`, {
//                     method: 'DELETE',
//                 })
//                     .then(res => res.json())
//                     .then(data => {
//                         if (data.deletedCount > 0) {
//                             const remainingContacts = contacts.filter(item => item._id !== _id);
//                             setContacts(remainingContacts);

//                             Swal.fire({
//                                 position: "top-end",
//                                 icon: "success",
//                                 title: `${name}'s contact question has been deleted`,
//                                 showConfirmButton: false,
//                                 timer: 1500
//                             });
//                         }
//                     });
//             }
//         });
//     };

//     // fallback values
//     const displayPhone = phone?.trim() ? phone : "Not provided";
//     const displaySubject = subject?.trim() ? subject : "No subject submitted";

//     return (
//         <>
//             <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200">
//                 <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
//                 <td className="py-4 px-4 text-lg font-bold text-gray-800">{name}</td>
//                 <td className="py-4 px-4 text-lg text-gray-700">{email}</td>
//                 <td className="py-4 px-4 text-lg text-gray-700">{displayPhone}</td>
//                 <td className="py-4 px-4 text-center">
//                     <button
//                         className="btn bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full"
//                         onClick={() => setShowModal(true)}
//                     >
//                         <TbMessageCheck className="text-2xl" />
//                     </button>
//                 </td>
//                 <td className="py-4 px-4 text-center">
//                     <button onClick={handleContactDelete}
//                         className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
//                     >
//                         <LuMessageCircleX className="text-2xl" />
//                     </button>
//                 </td>
//             </tr>

//             {/* Modal */}
//             {showModal && (
//                 <dialog id={`modal_${_id}`} className="modal" open>
//                     <div className="modal-box">
//                         <form method="dialog">
//                             <button
//                                 className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
//                                 onClick={() => setShowModal(false)}
//                             >
//                                 <span className="text-xl">✕</span>
//                             </button>
//                         </form>
//                         <p className="mb-3 text-xl font-semibold">
//                             <span className="text-[#2acb35]">{name}'s</span> Message Here :
//                         </p>
//                         <div className="border-1 border-gray-300 rounded-xl p-5">
//                             <h3 className="text-[#2acb35] font-bold text-xl mb-2 pb-3 border-b-3 border-dashed border-b-[#2acb35]">Subject:</h3>
//                             <p className="text-lg font-medium text-gray-700">{displaySubject}</p>
//                         </div>
//                         <br />
//                         <div className="border-1 border-gray-300 rounded-xl p-5">
//                             <h3 className="font-bold text-xl text-[#2acb35] mb-2 pb-3 border-b-3 border-dashed border-b-[#2acb35]">Message:</h3>
//                             <p className="text-gray-700 text-lg font-medium">{message}</p>
//                         </div>
//                     </div>
//                 </dialog>
//             )}
//         </>
//     );
// };

// export default ContactMessage;
