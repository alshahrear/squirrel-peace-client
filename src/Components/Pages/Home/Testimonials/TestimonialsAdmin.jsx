
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2'

const TestimonialsAdmin = () => {
    
    const handleTestimonial = e => {
        e.preventDefault();
        const form = e.target;

        const customerName = form.customerName.value;
        const rating = form.rating.value;
        const review = form.review.value;
        const profileLink = form.profileLink.value;
        const addTestimonial = { customerName, rating, review, profileLink }
        console.log(addTestimonial);

        fetch('http://localhost:5000/reviews', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(addTestimonial)
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.insertedId) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your testimonial has been added",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    form.reset();
                }

            })
    }


    return (
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2">
            <h1 className="text-3xl font-bold">Welcome <i className="text-[#2acb35]">Shishir Rayhan</i> to the Testimonial Administration Panel</h1>
            <p className="text-xl font-semibold">Please add a new testimonial to help us build trust and credibility with future clients.</p>
            <NavLink to="/testimonialPage">
                <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                       See Testimonial
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
            </NavLink>
            <div className="flex justify-center mt-5">
                {/* Form Section: 2/3 */}
                <div className="w-2/3 ">
                    <p className="text-2xl font-semibold mb-3">Please add your <span className="text-[#2acb35]">testimonial</span> here</p>
                    <form onSubmit={handleTestimonial} className="space-y-5 ">
                        <div className="grid grid-cols-2 gap-6">
                            <input
                                type="text"
                                name="customerName"
                                required
                                placeholder="Customer Name*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <select
                                defaultValue="Pick a rating"
                                name="rating"
                                required
                                className="w-full text-gray-500 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]">
                                <option required disabled={true}>Pick a rating</option>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                                <option>4.5</option>
                                <option>5</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <input
                                type="text"
                                name="profileLink"
                                required
                                placeholder="Customer Profile Link (Imgbb URL)"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <textarea
                                rows="5"
                                name="review"
                                required
                                placeholder="Customer Review..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase"
                            >
                                Add Testimonials
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsAdmin;