// CommentsAdmin.jsx
import { useState } from "react";
import Swal from "sweetalert2";
import { LuMessageCircleX } from "react-icons/lu";
import { TbMessageCheck } from "react-icons/tb";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useAuth from "../../Layout/useAuth";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";

const CommentsAdmin = () => {
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();
  const { data: comments = [], refetch } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const res = await axiosSecure.get("/comment");
      return res.data;
    },
  });

  return (
    <div className="my-10 max-w-screen-xl mx-auto px-2 sm:px-4">
      <Helmet>
        <title>CommentAdmin - Squirrel Peace</title>
      </Helmet>

      <div className="text-center space-y-3 mb-8">
        <h1 className="text-3xl font-bold">
          Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Comments Administration Panel
        </h1>
        <p className="max-w-5xl mx-auto">
          Here you can view all comments submitted by users on different blogs. You can see which blog each comment belongs to and review the content carefully. From this panel, you can also contact the commenters directly if needed. Please manage the comments responsibly to maintain a positive and engaging community.
        </p>
      </div>

      <div className="mb-4 text-right pr-3 text-2xl font-semibold text-gray-800">
        Total Comments: <span className="text-[#2acb35]">{comments.length}</span>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full text-left border-collapse comments-table">
          <thead>
            <tr className="bg-[#2acb35] text-white text-xl">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4 text-center">Comment</th>
              <th className="py-3 px-4 text-center">Delete</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {comments.length > 0 ? (
              comments.map((comment, index) => (
                <CommentRow
                  key={comment._id}
                  comment={comment}
                  index={index}
                  refetch={refetch}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">No comments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive Table Styles */}
      <style>{`
        @media (max-width: 1024px) {
          .comments-table thead {
            display: none;
          }
          .comments-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 0.5rem;
            padding: 1rem;
            background: white;
            box-shadow: 0 0 5px rgb(0 0 0 / 0.1);
          }
          .comments-table tbody tr td {
            display: block;
            padding: 0.5rem 0;
            text-align: left !important;
            font-size: 1rem;
            border: none !important;
            position: relative;
            padding-left: 130px;
            word-break: break-word;
          }
          .comments-table tbody tr td::before {
            content: attr(data-label);
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-weight: 600;
            color: #2acb35;
            white-space: nowrap;
          }
          .comments-table tbody tr td.text-center {
            padding-left: 0;
          }
          .comments-table tbody tr td.text-center button {
            margin: 0 auto;
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

const CommentRow = ({ comment, index, refetch }) => {
  const { _id, name, email, comment: message, blogSlug, blogTitle, blogCategory, blogImage } = comment;
  const [showModal, setShowModal] = useState(false);
  const axiosSecure = useAxiosSecure();
  const navigate = useNavigate();

  const handleDeleteComment = async () => {
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
      const res = await axiosSecure.delete(`/comment/${_id}`);
      if (res.data.deletedCount > 0) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `Comment by ${name} has been deleted`,
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
        <td className="py-4 px-4 font-semibold text-gray-700" data-label="#"> {index + 1} </td>
        <td className="py-4 px-4 text-lg font-bold text-gray-800" data-label="Name"> {name} </td>
        <td className="py-4 px-4 text-lg text-gray-700" data-label="Email"> {email} </td>
        <td className="py-4 px-4 text-center" data-label="Comment">
          <button
            className="btn bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full"
            onClick={() => setShowModal(true)}
            title="View Comment"
          >
            <TbMessageCheck className="text-2xl" />
          </button>
        </td>
        <td className="py-4 px-4 text-center" data-label="Delete">
          <button
            onClick={handleDeleteComment}
            className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
            title="Delete Comment"
          >
            <LuMessageCircleX className="text-2xl" />
          </button>
        </td>
      </tr>

      {showModal && (
        <dialog open className="modal">
          <div className="modal-box max-w-2xl relative">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-lg"
              onClick={() => setShowModal(false)}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h2 className="mb-4 text-2xl text-center font-bold">
              <span className="text-[#2acb35]">{name}</span>'s Comment Details
            </h2>

            {blogTitle && (
              <p className="text-lg font-medium text-gray-700 mb-2">
                Title: <span className="font-semibold">{blogTitle}</span>
              </p>
            )}
            {blogCategory && (
              <p className="text-lg font-medium text-gray-700 mb-4">
                Category: <span className="font-semibold">{blogCategory}</span>
              </p>
            )}
            {blogImage && (
              <div className="my-4 w-full max-h-64 overflow-hidden rounded-lg border relative">
                <img
                  src={blogImage}
                  alt="Blog"
                  className="w-full h-48 object-cover"
                />
                {blogSlug && (
                  <button
                    onClick={() => navigate(`/blog/${blogSlug}`)}
                    className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/30 transition"
                  >
                    <span className="border py-1 px-4 rounded-full text-white font-semibold hover:scale-105 hover:border-[#2acb35] backdrop-blur-sm">
                      View Blog
                    </span>
                  </button>
                )}
              </div>
            )}

            <div className="border border-gray-300 rounded-xl p-5 mb-4">
              <p className="text-lg font-semibold pb-3">
                Comment <span className="text-[#2acb35] text-lg">_</span>
              </p>
              <p className="text-gray-700 text-lg font-medium">{message}</p>
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default CommentsAdmin;
