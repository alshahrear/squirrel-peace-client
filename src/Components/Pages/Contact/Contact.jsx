import { BiLogoLinkedin } from "react-icons/bi";
import { GrFacebookOption } from "react-icons/gr";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineMarkEmailRead } from "react-icons/md";
import { PiPhoneCallLight, PiArrowBendRightDownFill } from "react-icons/pi";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { TfiPinterest } from "react-icons/tfi";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useState } from "react";

const Contact = () => {
    const axiosPublic = useAxiosPublic();
    const { register, handleSubmit, reset } = useForm();
    const [isSending, setIsSending] = useState(false);

    const onSubmit = async (data) => {
        try {
            setIsSending(true);
            const res = await axiosPublic.post("/message", data);
            if (res.data.insertedId) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Your message has been sent!",
                    showConfirmButton: false,
                    timer: 2000,
                });
                reset();
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error.message || "Something went wrong!",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-[#f5f7ec]">
            <Helmet>
                <title>Contact - Storial Peace</title>
            </Helmet>

            <div className="py-10 max-w-screen-xl mx-auto">
                <div className="text-center">
                    <i className="text-2xl font-semibold text-[#2acb35]">Message Us</i>
                    <h2 className="text-3xl font-bold mt-2 uppercase">We'd Love To Hear From You</h2>
                </div>

                <div className="max-w-6xl mx-auto border-2 border-[#f5f4f3] my-12 p-6 md:p-10 flex flex-col lg:flex-row gap-6 lg:gap-10 rounded-2xl">
                    {/* Form Section */}
                    <div className="w-full lg:w-2/3 animate__animated animate__slideInLeft">
                        <p className="text-xl md:text-2xl font-semibold mb-3">
                            Leave your <em className="text-[#2acb35]">message</em> here
                        </p>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <input
                                    type="text"
                                    {...register("name", { required: true })}
                                    placeholder="Your Name*"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                                <input
                                    type="email"
                                    {...register("email", { required: true })}
                                    placeholder="Your Email*"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                                <input
                                    type="text"
                                    {...register("phone")}
                                    placeholder="Phone (Optional)"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                                <input
                                    type="text"
                                    {...register("subject")}
                                    placeholder="Subject (Optional)"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                            </div>
                            <textarea
                                rows="5"
                                {...register("message", { required: true })}
                                placeholder="Your Message..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                            <button
                                type="submit"
                                disabled={isSending}
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-5 rounded-full hover:bg-[#59ca59] transition duration-300 hover:scale-105"
                            >
                                {isSending ? "SENDING MESSAGE..." : "SEND MESSAGE"}
                            </button>
                        </form>
                    </div>

                    {/* Info Section */}
                    <div className="w-full lg:w-1/3 space-y-4 border border-gray-300 rounded-2xl p-5 animate__animated animate__slideInUp animate__slow">
                        <p className="flex items-center text-sm md:text-[16px] font-medium gap-2">
                            <IoLocationOutline className="text-2xl md:text-3xl text-[#2acb35]" />
                            <span>Address: Road 3, Uttara Dhaka, Bangladesh</span>
                        </p>
                        <p className="flex items-center text-sm md:text-[16px] font-medium gap-2 border-y border-y-[#2acb35] py-4">
                            <PiPhoneCallLight className="text-xl md:text-2xl text-[#2acb35]" />
                            <span>Phone: +880 1612002913</span>
                        </p>
                        <p className="flex items-center text-sm md:text-[16px] font-medium gap-2 mb-6">
                            <MdOutlineMarkEmailRead className="text-xl md:text-2xl text-[#2acb35]" />
                            <span>Email: alshahrear1@gmail.com</span>
                        </p>
                        <div className="bg-[#2acb35] p-4 md:p-5 rounded-2xl">
                            <p className="text-center text-white text-xl md:text-2xl font-bold">Stay With Us On Social</p>
                            <p className="flex justify-center items-center text-base md:text-lg text-white font-semibold uppercase py-4">
                                Follow Us <span className="text-2xl font-bold"><PiArrowBendRightDownFill /></span>
                            </p>
                            <div className='flex flex-wrap justify-center items-center gap-3'>
                                <SocialButton Icon={GrFacebookOption} title="Facebook" />
                                <SocialButton Icon={RxInstagramLogo} title="Instagram" />
                                <SocialButton Icon={RiTwitterXLine} title="Twitter" />
                                <SocialButton Icon={BiLogoLinkedin} title="Linkedin" />
                                <SocialButton Icon={TfiPinterest} title="Pinterest" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SocialButton = ({ Icon, title }) => (
    <button
        title={title}
        className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115"
    >
        <Icon />
    </button>
);

export default Contact;
