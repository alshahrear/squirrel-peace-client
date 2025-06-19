import { useState } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { LuMessageCircleX } from "react-icons/lu";
import { TbMessageCheck } from "react-icons/tb";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../../Layout/useAuth";
import { Helmet } from "react-helmet";

const ContactAdmin = () => {
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();

  const { data: contacts = [], refetch } = useQuery({
    queryKey: ["admin-contacts"],
    queryFn: async () => {
      const res = await axiosSecure.get("/contact");
      return res.data;
    },
  });

  return (
    <div className="my-10 max-w-screen-xl mx-auto px-4">
      <Helmet>
        <title>ContactAdmin - Storial Peace</title>
      </Helmet>
      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl font-bold">
          Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Contact Administration Panel
        </h1>
        <p className="text-lg text-gray-700 font-medium">
          Here are the people who reached out to us using the contact form!
        </p>
        <NavLink to="/contact">
          <button className="relative overflow-hidden px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
            <span className="relative z-10 group-hover:text-[#404040]">Go To Contact Page</span>
            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
          </button>
        </NavLink>
      </div>

      <div className="mb-4 text-right pr-3 text-2xl font-semibold text-gray-800">
        Total Question: <span className="text-[#2acb35]">{contacts.length}</span>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full text-left border-collapse contact-table">
          <thead>
            <tr className="bg-[#2acb35] text-white text-xl">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4 text-center">Message</th>
              <th className="py-3 px-4 text-center">Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <ContactMessage key={contact._id} contact={contact} index={index} refetch={refetch} />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">No submitted questions found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        /* Responsive styles for contact table */
        @media (max-width: 1024px) {
          .contact-table thead {
            display: none; /* Hide header on mobile/tablet */
          }
          .contact-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 0.5rem;
            padding: 1rem;
            background: white;
            box-shadow: 0 0 5px rgb(0 0 0 / 0.1);
          }
          .contact-table tbody tr td {
            display: block;
            padding: 0.5rem 0;
            text-align: left !important;
            font-size: 1rem;
            border: none !important;
            position: relative;
            padding-left: 120px; /* space for label */
          }
          .contact-table tbody tr td::before {
            content: attr(data-label);
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-weight: 600;
            color: #2acb35;
            white-space: nowrap;
          }
          .contact-table tbody tr td.text-center {
            padding-left: 0;
          }
          /* For buttons center alignment */
          .contact-table tbody tr td.text-center button {
            margin: 0 auto;
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

const ContactMessage = ({ contact, index, refetch }) => {
  const { _id, name, email, phone, subject, message } = contact;
  const [showModal, setShowModal] = useState(false);
  const axiosSecure = useAxiosSecure();

  const handleContactDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure to delete it?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const res = await axiosSecure.delete(`/contact/${_id}`);
      if (res.data.deletedCount > 0) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `${name}'s contact question has been deleted`,
          showConfirmButton: false,
          timer: 1500,
        });
        refetch();
      }
    }
  };

  return (
    <>
      <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200">
        <td className="py-4 px-4 font-semibold text-gray-700" data-label="#">
          {index + 1}
        </td>
        <td className="py-4 px-4 text-lg font-bold text-gray-800" data-label="Name">
          {name}
        </td>
        <td className="py-4 px-4 text-lg text-gray-700" data-label="Email">
          {email}
        </td>
        <td className="py-4 px-4 text-lg text-gray-700" data-label="Phone ">
          {phone || "Not provided"}
        </td>
        <td className="py-4 px-4 text-center" data-label="Message">
          <button
            className="btn bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full"
            onClick={() => setShowModal(true)}
          >
            <TbMessageCheck className="text-2xl" />
          </button>
        </td>
        <td className="py-4 px-4 text-center" data-label="Check">
          <button
            onClick={handleContactDelete}
            className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
          >
            <LuMessageCircleX className="text-2xl" />
          </button>
        </td>
      </tr>

      {showModal && (
        <dialog open className="modal">
          <div className="modal-box">
            <form method="dialog">
              <button
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </form>
            <p className="mb-3 text-xl font-semibold">
              <span className="text-[#2acb35]">{name}'s</span> Message Here :
            </p>
            <div className="border border-gray-300 rounded-xl p-5 mb-5">
              <h3 className="text-[#2acb35] font-bold text-xl mb-2 pb-3 border-b-2 border-dashed border-b-[#2acb35]">
                Subject:
              </h3>
              <p className="text-lg font-medium text-gray-700">{subject || "No subject submitted"}</p>
            </div>
            <div className="border border-gray-300 rounded-xl p-5">
              <h3 className="font-bold text-xl text-[#2acb35] mb-2 pb-3 border-b-2 border-dashed border-b-[#2acb35]">
                Message:
              </h3>
              <p className="text-gray-700 text-lg font-medium">{message}</p>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default ContactAdmin;
