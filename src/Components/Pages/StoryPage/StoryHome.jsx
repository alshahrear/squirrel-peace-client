import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { CgMenuLeftAlt } from "react-icons/cg";
import { ImCross } from "react-icons/im";
import Swal from 'sweetalert2';
import { RiDeleteBin6Line, RiEdit2Fill } from 'react-icons/ri';
import { LuMessageCircleMore } from 'react-icons/lu';
import { FcLike } from 'react-icons/fc';
import { FiCopy } from 'react-icons/fi';

const StoryHome = ({ storyBlog, onDelete, onUpdate }) => {
    const { _id, storyTitle, storyCategory, storyImage, storyDescription } = storyBlog;

    const [hovered, setHovered] = useState(false);
    const [copied, setCopied] = useState(false);
    const [formData, setFormData] = useState({
        storyTitle,
        storyCategory,
        storyImage,
        storyDescription
    });

    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    const handleStoryDelete = (id) => {
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
                fetch(`http://localhost:5000/story/${id}`, {
                    method: 'DELETE',
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.deletedCount > 0) {
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "Your story card has been deleted",
                                showConfirmButton: false,
                                timer: 1500
                            });
                            onDelete(id);
                        }
                    });
            }
        });
    };

    const handleStoryUpdate = (e) => {
        e.preventDefault();

        fetch(`http://localhost:5000/story/${_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        })
            .then(res => res.json())
            .then(data => {
                if (data.modifiedCount > 0) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your story card has been updated",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    onUpdate(_id, formData);
                    document.getElementById(`edit_modal_${_id}`).close();
                }
            });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img
                src={storyImage}
                alt="story-img"
                className="w-full h-80 object-cover"
            />

            <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

            {/* Dropdown menu */}
            <div className="absolute top-3 right-3 z-30 dropdown dropdown-end">
                <div
                    tabIndex={0}
                    role="button"
                    className="border border-white text-white p-1 rounded-md cursor-pointer transition-all duration-300 hover:border-[#2acb35] hover:text-[#2acb35] hover:bg-white bg-transparent"
                >
                    <CgMenuLeftAlt size={20} />
                </div>

                <ul
                    tabIndex={0}
                    className="dropdown-content menu rounded-box z-50 w-48 p-2 shadow-md bg-[#2acb35] gap-2 "
                >
                    <div className="px-2 py-2 rounded-md bg-gray-100 flex items-center justify-between text-xs font-medium">
                        <span className="truncate max-w-[110px]">{_id}</span>
                        <FiCopy onClick={handleCopy} className="cursor-pointer text-gray-600 hover:text-[#2acb35] text-xl" />
                    </div>
                    {copied && (
                        <p className="text-xs text-white font-semibold px-2 -mt-1 mb-1">ID Copied!</p>
                    )}
                    <button
                        onClick={() => document.getElementById(`edit_modal_${_id}`).showModal()}
                        className="btn text-sm font-semibold text-gray-700 hover:bg-green-100 hover:text-[#2acb35] transition-all duration-200 rounded-md hover:scale-105"
                    >
                        Edit <RiEdit2Fill className='ml-1 -mt-1 text-xl ' />
                    </button>
                    <button
                        onClick={() => handleStoryDelete(_id)}
                        className="btn text-sm font-semibold text-gray-700 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-md hover:scale-105"
                    >
                        Delete <RiDeleteBin6Line className='ml-1 -mt-1 text-xl' />
                    </button>
                </ul>
            </div>

            {/* Main content */}
            <div
                ref={ref}
                className={`absolute inset-0 flex flex-col justify-center text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
            >
                <h2 className="text-xl font-bold mb-2 drop-shadow-sm ">{storyTitle}</h2>
                <p className="text-sm group-hover:font-medium mb-4 leading-relaxed drop-shadow-sm transition-all duration-300">
                    {storyDescription}
                </p>
                <button
                    className={`btn self-start px-4 py-2 text-white rounded-md transition-all duration-300 hover:scale-110 hover:font-semibold hover:border-[#2acb35]
                        ${hovered ? "bg-transparent border-white animate__animated animate__heartBeat animate" : "bg-[#2acb35] border-0"}`}
                >
                    See More
                </button>

                <div className='absolute bottom-6 left-0 w-full px-4 flex items-center justify-between z-20'>
                    <div className="flex items-center gap-3">
                        <p className="flex items-center gap-1">
                            <LuMessageCircleMore className="text-[#2acb35]" />
                            <span className="beat-on-hover font-semibold">6</span>
                        </p>
                        <p className="flex items-center gap-1">
                            <FcLike />
                            <span className="beat-on-hover font-semibold">10</span>
                        </p>
                    </div>
                    <div className="text-white text-xs px-4 py-2 border border-white rounded-full">
                        {storyCategory}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <dialog id={`edit_modal_${_id}`} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            <ImCross />
                        </button>
                    </form>
                    <p className="text-2xl font-semibold mb-5 text-center">
                        Edit your <span className="text-[#2acb35]">Story</span>
                    </p>

                    <form onSubmit={handleStoryUpdate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="storyTitle"
                                value={formData.storyTitle}
                                onChange={e => setFormData({ ...formData, storyTitle: e.target.value })}
                                placeholder="Story Title"
                                className="w-full p-3 border rounded-md"
                                required
                            />
                            <input
                                type="text"
                                name="storyCategory"
                                value={formData.storyCategory}
                                onChange={e => setFormData({ ...formData, storyCategory: e.target.value })}
                                placeholder="Story Category"
                                className="w-full p-3 border rounded-md"
                                required
                            />
                        </div>

                        <input
                            type="text"
                            name="storyImage"
                            value={formData.storyImage}
                            onChange={e => setFormData({ ...formData, storyImage: e.target.value })}
                            placeholder="Image URL"
                            className="w-full p-3 border rounded-md"
                            required
                        />

                        <textarea
                            rows="4"
                            name="storyDescription"
                            value={formData.storyDescription}
                            onChange={e => setFormData({ ...formData, storyDescription: e.target.value })}
                            placeholder="Story Description..."
                            className="w-full p-3 border rounded-md"
                            required
                        ></textarea>

                        <button type="submit" className="btn w-full bg-[#2acb35] text-white font-semibold py-3 rounded-full hover:bg-[#59ca59] transition duration-300">
                            Update Story
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default StoryHome;
