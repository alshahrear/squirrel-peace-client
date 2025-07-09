import Swal from "sweetalert2";
import { useState } from "react";
import story4 from "../../../assets/story4.jpg"

const StoryBottoms = ({ _id: storyId, storyTitle, storyCategory, storyImage }) => {
    const [isSubmitting, setIsSubmitting] = useState(false); // loading state

    const handleComment = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const comment = form.comment.value;

        const newComment = {
            name,
            email,
            comment,
            storyId,
            storyTitle: storyTitle,
            storyCategory: storyCategory,
            storyImage: storyImage,
        };

        fetch("https://squirrel-peace-server.onrender.com/comment/story", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newComment),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.insertedId) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Thanks for your comment!",
                        showConfirmButton: false,
                        timer: 2500,
                    });
                    form.reset();
                }
            })
            .catch((error) => {
                console.error("Error submitting comment:", error);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-10 w-full px-4 md:px-0 ">
            {/* Comment Section */}
            <div className="w-full lg:w-2/3">
                <h2 className="text-xl md:text-2xl font-bold mb-5">Leave a Reply</h2>

                <form onSubmit={handleComment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <input
                            type="text"
                            name="name"
                            placeholder="Your Name *"
                            className="border border-[#2acb35] p-3 md:p-4 w-full outline-none rounded"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Your Email *"
                            className="border border-[#2acb35] p-3 md:p-4 w-full outline-none rounded"
                            required
                        />
                    </div>
                    <textarea
                        rows="6"
                        name="comment"
                        placeholder="Comments *"
                        className="w-full border border-[#2acb35] p-3 md:p-4 outline-none rounded"
                        required
                    ></textarea>

                    <button
                        type="submit"
                        className="bg-[#2acb35] text-white text-sm md:text-base font-semibold py-2 md:py-3 px-6 md:px-8 rounded-full transition duration-300 w-full md:w-auto"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting Comment..." : "Submit Comment"}
                    </button>
                </form>
            </div>

            {/* Newsletter Section */}
            <div className="w-full lg:w-1/3 bg-white border border-gray-200 rounded-xl shadow text-center flex flex-col items-center">
                <div className="py-5 px-5">
                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-3">
                        Join Our Newsletter <br /> 100% free
                    </h2>
                    <p className="text-gray-600 mb-3">
                        Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing, focus, and finding balance in your creative work.
                    </p>
                    <a
                        href="https://emerald-diary.beehiiv.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                    >
                        <button
                            type="button"
                            className="w-full bg-[#2acb35] hover:bg-[#26b030] transition duration-300 text-white font-semibold py-3 rounded-lg"
                        >
                            Subscribe Now
                        </button>
                    </a>
                </div>
                <img className="rounded-b-xl w-full h-60" src={story4} alt="" />
            </div>
        </div>
    );
};

export default StoryBottoms;
