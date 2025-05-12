
import { useEffect, useState } from "react";
import Testimonial from "./Testimonial";

const Testimonials = () => {

    const [testimonials, setTestimonials] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/reviews')
            .then(res => res.json())
            .then(data => {
                setTestimonials(data);
            })
            .catch(error => {
                console.error("Error loading testimonials:", error);
            });
    }, []);

    return (
        <div className="bg-[#f5f4f3]">
            <div className="text-center py-5 space-y-2">
                <h2 className="text-3xl text-[#2acb35] font-bold">Testimonials</h2>
                <p className="text-xl font-semibold">What our customers say</p>
                <p className="text-lg font-medium">Lot of people got benefit of our programs.</p>
            </div>
            <div className="grid grid-cols-4 max-w-screen-xl mx-auto">
                {
                    testimonials.map(testimonial => <Testimonial key={testimonial.id} testimonial={testimonial}></Testimonial>)
                }
            </div>
        </div>
    );
};

export default Testimonials;
