
import BlogHomeCat from './BlogHomeCat';

const BlogHomeCats = () => {
    return (
        <div className="py-10 bg-white text-center">
            <div className="text-center">
                <h3 className="text-3xl font-bold mb-2">Blog Category</h3>
                <p className="text-lg text-gray-600 ">
                    Explore our diverse range of blog categories to discover articles on technology <br /> design, development, marketing, and more.
                </p>
            </div>

            <div>
                <BlogHomeCat></BlogHomeCat>
            </div>
        </div>
    );
};

export default BlogHomeCats;
