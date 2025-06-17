import { useState } from "react";
import Swal from "sweetalert2";
import { LuMessageCircleX, LuCopy, LuCheck } from "react-icons/lu";
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
        <div className="my-10 max-w-screen-xl mx-auto">
            <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl font-bold">
                    Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Comments Administration Panel
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                    Here are the comments submitted by users!
                </p>
            </div>

            <div className="mb-4 text-right pr-3 text-2xl font-semibold text-gray-800">
                Total Comments: <span className="text-[#2acb35]">{comments.length}</span>
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="table-auto w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#2acb35] text-white text-xl">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Type</th>
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
        </div>
    );
};

const CommentRow = ({ comment, index, refetch }) => {
    const { _id, name, email, comment: message } = comment;
    const [showModal, setShowModal] = useState(false);
    const [copied, setCopied] = useState(false);
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

    const handleCopy = () => {
        const id = comment.blogId || comment.storyId;
        if (id) {
            navigator.clipboard.writeText(id);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }
    };

    const id = comment.blogId || comment.storyId;
    const title = comment.blogTitle || comment.storyTitle;
    const category = comment.blogCategory || comment.storyCategory;
    const image = comment.blogImage || comment.storyImage;
    const type = comment.blogId ? "Blog" : comment.storyId ? "Story" : "";

    return (
        <>
            <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200">
                <Helmet>
                    <title>CommentAdmin - Storial Peace</title>
                </Helmet>
                <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
                <td className="py-4 px-4 text-lg font-bold text-gray-800">{name}</td>
                <td className="py-4 px-4 text-lg text-gray-700">{email}</td>
                <td className="py-4 px-4 text-lg text-gray-700 font-medium">{type}</td>
                <td className="py-4 px-4 text-center">
                    <button
                        className="btn bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full"
                        onClick={() => setShowModal(true)}
                    >
                        <TbMessageCheck className="text-2xl" />
                    </button>
                </td>
                <td className="py-4 px-4 text-center">
                    <button
                        onClick={handleDeleteComment}
                        className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
                    >
                        <LuMessageCircleX className="text-2xl" />
                    </button>
                </td>
            </tr>

            {showModal && (
                <dialog open className="modal">
                    <div className="modal-box max-w-2xl">
                        <form method="dialog">
                            <button
                                className="btn btn-sm btn-circle btn-ghost absolute text-lg right-2 top-2"
                                onClick={() => setShowModal(false)}
                            >
                                ✕
                            </button>
                        </form>
                        <h2 className="mb-4 text-2xl text-center font-bold">
                            <span className="text-[#2acb35]">{name}</span>'s Comment Details
                        </h2>

                        {title && (
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Title: <span className="font-semibold">{title}</span>
                            </p>
                        )}
                        {category && (
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Category: <span className="font-semibold">{category}</span>
                            </p>
                        )}

                        {id && (
                            <p className="text-lg flex items-center gap-2">
                                ID: <span className="font-semibold">{id}</span>
                                <button
                                    className="text-[#2acb35] hover:text-[#25b22f]"
                                    onClick={handleCopy}
                                    title="Copy ID"
                                >
                                    {copied ? (
                                        <LuCheck className="text-lg" />
                                    ) : (
                                        <LuCopy className="text-lg" />
                                    )}
                                </button>
                            </p>
                        )}

                        {image && (
                            <div className="my-4 w-full max-h-64 overflow-hidden rounded-lg border">
                                <img
                                    src={image}
                                    alt="Blog"
                                    className="w-full h-48 object-cover"
                                />
                                {id && (
                                    <button
                                        onClick={() => {
                                            if (type === "Blog") {
                                                navigate(`/blog/${id}`);
                                            } else if (type === "Story") {
                                                navigate(`/story/${id}`);
                                            }
                                        }}
                                        className="w-full h-16 text-white font-semibold relative"
                                        style={{
                                            backgroundImage: `url(${image})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                        }}
                                    >
                                        <div className="absolute inset-0 bg-black/50 rounded-b-lg"></div>
                                        <span className="relative z-10 border py-1 px-4 rounded-full hover:scale-105 hover:border-[#2acb35]">
                                            {type === "Blog" ? "View Blog" : "View Story"}
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
