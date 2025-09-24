// WinAdmin.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';
import dayjs from 'dayjs';
import { FaSpinner } from 'react-icons/fa';
import { Helmet } from 'react-helmet';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const WinAdmin = () => {
  const { user } = useAuth();
  const axiosPublic = useAxiosPublic();
  const { register, handleSubmit, reset } = useForm();
  const today = dayjs().format("YYYY-MM-DD");

  const [winnerDate, setWinnerDate] = useState(today);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', data.giftImage[0]);

      const imageRes = await axiosPublic.post(image_hosting_api, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const imageUrl = imageRes.data?.data?.display_url;
      if (!imageUrl) throw new Error("Image upload failed");

      const formattedDate = dayjs(winnerDate).format("D MMMM, YYYY");

      const winnerData = {
        winnerName: data.winnerName,
        winnerGift: data.winnerGift,
        winnerGender: data.winnerGender,
        winnerReview: data.winnerReview,
        winnerDate: formattedDate,
        giftImage: imageUrl,
      };

      const res = await axiosPublic.post('/winner', winnerData);

      if (res.data?.insertedId) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Winner details has been added",
          showConfirmButton: false,
          timer: 1500
        });
        reset();
        setWinnerDate(today);
      } else {
        throw new Error("Failed to save winner");
      }

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Something went wrong!"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="my-10 max-w-screen-xl mx-auto text-center space-y-2 px-3 sm:px-4">
      <Helmet>
        <title>Winner Admin - Squirrel Peace</title>
      </Helmet>

      <h1 className=" text-2xl md:text-3xl font-semibold">
        Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Winner Administration Panel
      </h1>
      <p className="max-w-5xl mx-auto mb-5">
        Here you can upload and manage winners to be displayed on our website. Please ensure that each winner's details are accurate and properly formatted.
      </p>

      <NavLink to="/quiz">
        <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
          <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
            Go Quiz Page
          </span>
          <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
        </button>
      </NavLink>

      <div className="flex justify-center mt-5">
        <div className="w-full sm:w-2/3 px-2 sm:px-0">
          <p className="text-2xl font-semibold mb-3">
            Please add <span className="text-[#2acb35]">winner details</span> here
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                {...register("winnerName", { required: true })}
                placeholder="Winner Name*"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              />

              <input
                {...register("winnerGift", { required: true })}
                placeholder="Winner Gift*"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <select
                {...register("winnerGender", { required: true })}
                defaultValue=""
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              >
                <option value="" disabled>Winner Gender*</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </div>

            <textarea
              rows="2"
              {...register("winnerReview", { required: true })}
              placeholder="Winner Review..."
              className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <input
                type="file"
                {...register("giftImage", { required: true })}
                className="file-input file-input-ghost w-full"
              />
              <input
                type="date"
                value={winnerDate}
                onChange={(e) => setWinnerDate(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  Adding Winner <FaSpinner className="animate-spin" />
                </>
              ) : (
                "Add Winner"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WinAdmin;
