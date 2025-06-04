
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2'
import useAuth from '../../Layout/useAuth';

const StoryBlogAdmin = () => {
    const {user} = useAuth();
    
    const handleStory = e => {
        e.preventDefault();
        const form = e.target;

        const storyTitle = form.storyTitle.value;
        const storyCategory = form.storyCategory.value;
        const storyImage = form.storyImage.value;
        const storyDescription = form.storyDescription.value;
        const addStory = { storyTitle, storyCategory, storyImage, storyDescription }
        console.log(addStory);

        fetch('http://localhost:5000/story', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(addStory)
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.insertedId) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your story has been added",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    form.reset();
                }

            })
    }


    return (
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Story Blog Administration Panel</h1>
            <p className="text-xl font-semibold">Please add a new story blog to help us build trust and credibility with future clients.</p>
            <NavLink to="/storyPages">
                <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                       Go Story Page
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
            </NavLink>
            <div className="flex justify-center mt-5">
                {/* Form Section: 2/3 */}
                <div className="w-2/3 ">
                    <p className="text-2xl font-semibold mb-3">Please add your <span className="text-[#2acb35]">story blog</span> here</p>
                    <form onSubmit={handleStory} className="space-y-5 ">
                        <div className="grid grid-cols-2 gap-6">
                            <input
                                type="text"
                                name="storyTitle"
                                required
                                placeholder="Story Title*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <input
                                type="text"
                                name="storyCategory"
                                required
                                placeholder="Story Category*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                name="storyImage"
                                required
                                placeholder="Story Image Link (Imgbb URL)"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <textarea
                                rows="5"
                                name="storyDescription"
                                required
                                placeholder="Story Description..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase"
                            >
                                Add Story
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StoryBlogAdmin;