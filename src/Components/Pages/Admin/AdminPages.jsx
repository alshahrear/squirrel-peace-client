import { Link } from "react-router-dom";

const AdminPages = () => {
    return (
        <div className="py-10 max-w-screen-xl mx-auto">
            <div className="text-center space-y-3 mb-10">
                <h1 className="text-3xl font-bold">Welcome <span className="text-[#2acb35]">Shishir Rayhan</span> to the Main Administration Panel</h1>
                <p className="">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Quasi suscipit iure nostrum at, tempora delectus quos exercitationem ea fugit illo voluptate</p>
            </div>
            <div className=" grid grid-cols-4 text-center justify-center gap-y-10">
                <Link to="/contactAdmin">
                    <button className="btn  text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Contact Admin
                    </button>
                </Link>
                <Link to="/faqAdmin">
                    <button className="btn text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Faq Admin
                    </button>
                </Link>
                <Link to="/testimonialsAdmin">
                    <button className="btn text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Testimonial Admin
                    </button>
                </Link>
                <Link to="/storyBlogAdmin">
                    <button className="btn text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Story Admin
                    </button>
                </Link>
                <Link to="/blogPageAdmin">
                    <button className="btn text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Blog Admin
                    </button>
                </Link>
                <Link to="/users">
                    <button className="btn text-lg font-semibold bg-[#2acb35] text-white hover:scale-105">
                        Users Admin
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default AdminPages;