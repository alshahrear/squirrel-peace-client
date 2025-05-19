import { BiLogoLinkedin } from "react-icons/bi";
import { GrFacebookOption } from "react-icons/gr";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineMarkEmailRead } from "react-icons/md";
import { PiPhoneCallLight } from "react-icons/pi";
import { RiTwitterXLine } from "react-icons/ri";
import { RxInstagramLogo } from "react-icons/rx";
import { TfiPinterest } from "react-icons/tfi";
import { PiArrowBendRightDownFill } from "react-icons/pi";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";


const Contact = () => {

    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/contact')
            .then(res => res.json())
            .then(data => setContacts(data))
            .catch(error => console.error("Error loading contacts:", error));
    }, []);


    const handleAddContact = (e) => {
    e.preventDefault();
    const form = e.target;

    const name = form.name.value;
    const email = form.email.value;
    const phone = form.phone.value;
    const subject = form.subject.value;
    const message = form.message.value;
    const addContact = { name, email, phone, subject, message };

    fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(addContact),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.insertedId) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Message received! Thanks for contacting us — we'll reply to your email soon.",
                    showConfirmButton: false,
                    timer: 2000,
                });
                // ফর্ম রিসেট
                form.reset();

                // নতুন মেসেজ যোগ করো স্টেটে
                setContacts([...contacts, { _id: data.insertedId, ...addContact }]);
            }
        });
};



    return (
        <div className="my-12 max-w-screen-xl mx-auto">
            <div className="text-center">
                <i className="text-2xl font-semibold text-[#2acb35] ">Quick Contact</i>
                <h2 className="text-3xl font-bold mt-2 uppercase">Get Touch With Us</h2>
                <NavLink to="/contactAdmin">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">{contacts.length}</span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040] hover:scale-105">
                                Contact Admin Page
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
            </div>
            {/* contact form */}
            <div className="max-w-6xl mx-auto border-2 border-[#f5f4f3] my-12 p-10 flex gap-10 rounded-2xl">
                {/* Form Section: 2/3 */}
                <div className="w-2/3 animate__animated animate__slideInLeft">
                    <p className="text-2xl font-semibold mb-3">Leave your <em className="text-[#2acb35]">message</em> here</p>
                    <form onSubmit={handleAddContact} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <input
                                type="text"
                                name="name"
                                required
                                placeholder="Your Name*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <input
                                type="email"
                                name="email"
                                required
                                placeholder="Your Email*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <input
                                type="text"
                                name="phone"
                                placeholder="Phone (Optional)"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <input
                                type="text"
                                name="subject"
                                placeholder="Subject (Optional)"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                        </div>
                        <div>
                            <textarea
                                rows="5"
                                name="message"
                                required
                                placeholder="Your Message..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 hover:scale-105"
                            >
                                SEND MESSAGE
                            </button>
                        </div>
                    </form>
                </div>

                {/* Address Section: 1/3 */}
                <div className="w-1/3 space-y-4 border-gray-300 border-l border-y rounded-2xl p-5 animate__animated animate__slideInUp animate__slow">
                    <p className="flex items-center text-[16px] font-medium gap-2">
                        <IoLocationOutline className="text-3xl text-[#2acb35]" />
                        <span>Address: Road 3, Uttara Dhaka, Bangladesh</span>
                    </p>
                    <p className="flex items-center text-[16px] font-medium gap-2 border-y border-y-[#2acb35] py-5">
                        <PiPhoneCallLight className="text-2xl text-[#2acb35]" />
                        <span>Phone: +880 1612002913</span>
                    </p>
                    <p className="flex items-center text-[16px] font-medium gap-2 mb-10">
                        <MdOutlineMarkEmailRead className="text-2xl text-[#2acb35]" />
                        <span>Email: alshahrear1@gmail.com</span>
                    </p>
                    <div className="bg-[#2acb35] p-5 rounded-4xl">
                        <p className="text-center text-white text-2xl font-bold ">Stay With Us On Social</p>
                        <p className="flex justify-center items-center text-lg text-white font-semibold uppercase py-5">Follow Us <span className="text-2xl font-bold"><PiArrowBendRightDownFill></PiArrowBendRightDownFill></span></p>
                        <div className='flex items-center space-x-5'>
                            <button title="Facebook" className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115">
                                <GrFacebookOption />
                            </button>
                            <button title="Instagram" className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115">
                                <RxInstagramLogo></RxInstagramLogo>
                            </button>
                            <button title="Twitter" className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115">
                                <RiTwitterXLine></RiTwitterXLine>
                            </button>
                            <button title="Linkedin" className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115">
                                <BiLogoLinkedin></BiLogoLinkedin>
                            </button>
                            <button title="Pinterest" className="flex justify-center items-center w-10 h-10 border-2 border-[#323232] p-2 rounded-full text-2xl text-white hover:text-[#2acb35] hover:bg-white hover:border-[#2acb35] transition transform hover:scale-115">
                                <TfiPinterest></TfiPinterest>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Contact;