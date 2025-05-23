import BlogHomeLatest from "./BlogHomeLatest";

const BlogHomeLatests = () => {
    return (
        <div className="pt-10 bg-[#f5f7ec] text-center">
            <div className="text-center">
                <h3 className="text-3xl font-bold mb-2">Latest Blog</h3>
                <p className="text-lg text-gray-600 ">
                    Explore our diverse range of blog categories to discover articles on technology <br /> design, development, marketing, and more.
                </p>
            </div>
            <div>
                <BlogHomeLatest></BlogHomeLatest>
            </div>
        </div>
    );
};

export default BlogHomeLatests;