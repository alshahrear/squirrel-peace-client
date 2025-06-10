import Swal from "sweetalert2";

const StoryBottoms = ({ blogId, storyTitle, storyCategory, storyImage }) => {

    const handleComment = (e) => {
        e.preventDefault();
        const form = e.target;
        const name = form.name.value;
        const email = form.email.value;
        const comment = form.comment.value;

        // updated with additional blog info
        const newComment = {
            name,
            email,
            comment,
            blogId,
            blogTitle: storyTitle,
            blogCategory: storyCategory,
            blogImage: storyImage,
        };

        fetch("http://localhost:5000/comment", {
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
            });
    };

    return (
        <div className="w-full md:w-2/3">
            <h2 className="text-2xl font-bold mb-5">Leave a Reply</h2>

            <form onSubmit={handleComment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                        type="text"
                        name="name"
                        placeholder="Your Name *"
                        className="border border-[#2acb35] p-4 w-full outline-none rounded"
                        required
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Your Email *"
                        className="border border-[#2acb35] p-4 w-full outline-none rounded"
                        required
                    />
                </div>

                <textarea
                    rows="8"
                    name="comment"
                    placeholder="Comments *"
                    className="w-full border border-[#2acb35] p-4 outline-none rounded"
                    required
                ></textarea>

                <button
                    type="submit"
                    className="bg-[#2acb35] text-white font-semibold py-3 px-8 rounded-full transition duration-300"
                >
                    Submit Comment
                </button>
            </form>
        </div>
    );
};

export default StoryBottoms;
