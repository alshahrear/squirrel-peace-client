import { Rating, Star } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { RiMenu2Line, RiDeleteBin6Line, RiEdit2Fill } from "react-icons/ri";
import Swal from 'sweetalert2';
import { ImCross } from "react-icons/im";
import { useState } from 'react';
import useAuth from '../../Layout/useAuth';
import useAdmin from '../../../hooks/useAdmin';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const customStyle = {
  itemShapes: Star,
  activeFillColor: '#FFD700',
  inactiveFillColor: '#e0e0e0',
};

const TestimonialBlog = ({ testimonialBlog, onDelete, onUpdate }) => {
  const { _id, customerName, rating, random, review, profileLink } = testimonialBlog;
  const [formData, setFormData] = useState({ customerName, rating, random, review, profileLink });

  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const [newImageFile, setNewImageFile] = useState(null);

  const handleReviewDelete = (id) => {
    Swal.fire({
      title: "Are you sure to delete it?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`https://squirrel-peace-server.onrender.com/reviews/${id}`, {
          method: 'DELETE',
        })
          .then(res => res.json())
          .then(data => {
            if (data.deletedCount > 0) {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your testimonial card has been deleted",
                showConfirmButton: false,
                timer: 1500
              });
              onDelete(id);
            }
          });
      }
    });
  };

  const handleReviewUpdate = async e => {
    e.preventDefault();

    let updatedData = { ...formData };

    if (newImageFile) {
      const imageData = new FormData();
      imageData.append('image', newImageFile);

      const res = await fetch(image_hosting_api, {
        method: 'POST',
        body: imageData,
      });

      const imageResponse = await res.json();
      if (imageResponse.success) {
        updatedData.profileLink = imageResponse.data.display_url;
      }
    }

    fetch(`https://squirrel-peace-server.onrender.com/reviews/${_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData)
    })
      .then(res => res.json())
      .then(data => {
        if (data.modifiedCount > 0) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Your testimonial card has been updated",
            showConfirmButton: false,
            timer: 1500
          });
          onUpdate(_id, updatedData);
          document.getElementById(`edit_modal_${_id}`).close();
        }
      });
  };

  return (
    <div className="p-4 h-64">
      <div className="card bg-base-100 bg-opacity-80 shadow-xl h-full flex flex-col group hover:scale-105 hover:shadow-2xl transition duration-300 relative">

        {user && isAdmin &&
          <div className="absolute top-2 right-3 z-20 dropdown dropdown-top dropdown-end">
            <div tabIndex={0} role="button" className="btn m-1 p-2 h-10 w-10 border-2 border-[#2acb35] text-[#2acb35] hover:bg-[#2acb35] hover:text-white rounded-lg">
              <RiMenu2Line className="text-lg" />
            </div>
            <ul tabIndex={0} className="dropdown-content menu text-lg font-medium text-white bg-[#2acb35] rounded-box w-52 p-2">
              <button
                className="btn bg-white font-semibold text-black hover:bg-white/70 mb-2"
                onClick={() => document.getElementById(`edit_modal_${_id}`).showModal()}
              >
                Edit <RiEdit2Fill className='ml-1 -mt-1 text-xl ' />
              </button>
              <button
                onClick={() => handleReviewDelete(_id)}
                className="btn bg-white font-semibold text-black hover:bg-white/70"
              >
                Delete <RiDeleteBin6Line className='ml-1 -mt-1 text-xl' />
              </button>
            </ul>
          </div>
        }

        <div className="card-body">
          <div className="flex items-center">
            <img src={profileLink} alt={customerName} className="w-20 h-20 rounded-full object-cover border-4 border-white group-hover:border-[#2acb35]" />
            <div className="ml-3">
              <h2 className="text-xl text-[#2acb35] font-semibold">{customerName}</h2>
              <Rating style={{ maxWidth: 100 }} value={parseFloat(rating)} readOnly itemStyles={customStyle} />
            </div>
          </div>
          <p className="mt-3 font-medium text-gray-700">"{review}"</p>
        </div>
      </div>

      <dialog id={`edit_modal_${_id}`} className="modal">
        <div className="modal-box w-11/12 max-w-2xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"><ImCross /></button>
          </form>
          <p className="text-2xl font-semibold mb-5 text-center">Edit your <span className="text-[#2acb35]">testimonial</span></p>

          <form onSubmit={handleReviewUpdate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Customer Name*"
                className="w-full p-3 border rounded-md"
              />
              <select
                name="rating"
                value={formData.rating}
                onChange={e => setFormData({ ...formData, rating: e.target.value })}
                className="w-full p-3 border rounded-md text-gray-500"
              >
                <option disabled>Pick a rating</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>4.5</option>
                <option>5</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={e => setNewImageFile(e.target.files[0])}
                className="file-input file-input-ghost w-full"
              />
              <input
                type="text"
                name="random"
                value={formData.random}
                onChange={e => setFormData({ ...formData, random: e.target.value })}
                placeholder="Random*"
                className="w-full p-3 border rounded-md"
              />
            </div>

            <textarea
              rows="4"
              name="review"
              value={formData.review}
              onChange={e => setFormData({ ...formData, review: e.target.value })}
              placeholder="Customer Review..."
              className="w-full p-3 border rounded-md"
            ></textarea>

            <button type="submit" className="btn w-full bg-[#2acb35] text-white font-semibold py-3 rounded-full hover:bg-[#59ca59] transition duration-300">
              Update Testimonial
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default TestimonialBlog;
