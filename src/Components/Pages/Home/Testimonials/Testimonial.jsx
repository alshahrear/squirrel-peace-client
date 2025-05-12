// import testimonialsHome from "../../../../assets/Testimonialshome.jpg";

const Testimonial = ({testimonial}) => {
    const { customerName, rating, review, profileLink } = testimonial;
    return (
        <div className="w-96 p-5 ">
                <div className="card bg-base-100 bg-opacity-80 shadow-xl h-full flex flex-col min-h-[200px] mr-10">
                    <div className="card-body flex-grow">
                        <div className="flex items-center">
                            <div>
                                <img
                                    src={profileLink}
                                    alt=""
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            </div>
                            <div className="ml-3">
                                <h2 className="text-xl font-semibold">{customerName}</h2>
                                <p>Dhaka, Bangladesh</p>
                            </div>
                        </div>
                        <div className="pt-3 flex-grow">
                            <p className="font-medium">
                                {review}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default Testimonial;