import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { CgMenuLeftAlt } from "react-icons/cg";
import { ImCross } from "react-icons/im";
import Swal from 'sweetalert2';
import { RiDeleteBin6Line, RiEdit2Fill } from 'react-icons/ri';
import { FiCopy } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const AdventureBlog = ({ adventureBlog, onDelete, onUpdate, searchTerm }) => {
  const { _id, blogSlug, blogTitle, blogRandom, blogShortDescription, blogCategory, blogImage, blogDate } = adventureBlog;

  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [newImageFile, setNewImageFile] = useState(null);
  const [formData, setFormData] = useState({
    blogTitle,
    blogCategory,
    blogRandom,
    blogShortDescription,
    blogImage,
  });

  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const navigate = useNavigate();

  const handleBlogDelete = (id) => {
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
        fetch(`https://squirrel-peace-server.onrender.com/blog/${id}`, {
          method: 'DELETE',
        })
          .then(res => res.json())
          .then(data => {
            if (data.deletedCount > 0) {
              Swal.fire({
                position: "top-end",
                icon: "success",
                title: "Your blog card has been deleted",
                showConfirmButton: false,
                timer: 1500
              });
              onDelete(id);
            }
          });
      }
    });
  };

  const handleBlogUpdate = async (e) => {
    e.preventDefault();

    // ফর্ম থেকে আপডেট ডেটা তৈরি
    const updatedData = {
      blogTitle: formData.blogTitle,
      blogCategory: formData.blogCategory,
      blogRandom: formData.blogRandom,
      blogShortDescription: formData.blogShortDescription, // নাম মেলানো হয়েছে
      blogImage: formData.blogImage,
    };

    // নতুন ছবি নির্বাচিত হলে ইমেজ হোস্টে আপলোড করে URL পেতে হবে
    if (newImageFile) {
      const imageData = new FormData();
      imageData.append('image', newImageFile);

      try {
        const res = await fetch(image_hosting_api, {
          method: 'POST',
          body: imageData,
        });
        const imageResponse = await res.json();
        if (imageResponse.success) {
          updatedData.blogImage = imageResponse.data.display_url;
        } else {
          throw new Error('Image upload failed');
        }
      } catch (err) {
        console.error('Image upload error:', err);
        Swal.fire({
          icon: 'error',
          title: 'Image Upload Failed',
          text: 'Could not upload the new image. Please try again.',
        });
        return;
      }
    }

    // সার্ভারে PATCH রিকোয়েস্ট
    try {
      const res = await fetch(`https://squirrel-peace-server.onrender.com/blog/${_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();

      if (data.modifiedCount > 0) {
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Your blog card has been updated',
          showConfirmButton: false,
          timer: 1500
        });
        onUpdate(_id, updatedData);
        document.getElementById(`edit_modal_${_id}`).close();
      } else {
        throw new Error('No document was modified');
      }
    } catch (err) {
      console.error('Update error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not update the blog. Please try again.',
      });
    }
  };


  const handleCopy = () => {
    navigator.clipboard.writeText(blogSlug);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 text-black">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group cursor-pointer"
      onClick={() => navigate(`/blog/${blogSlug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={blogImage}
        alt="blog-img"
        className="w-full h-80 object-cover"
      />

      <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

      {
        user && isAdmin &&
        <div className="absolute top-3 right-3 z-30 dropdown dropdown-end" onClick={(e) => e.stopPropagation()}>
          <div
            tabIndex={0}
            role="button"
            className="border border-white text-white p-1 rounded-md cursor-pointer transition-all duration-300 hover:border-[#2acb35] hover:text-[#2acb35] hover:bg-white bg-transparent"
          >
            <CgMenuLeftAlt size={20} />
          </div>

          <ul
            tabIndex={0}
            className="dropdown-content menu rounded-box z-50 w-48 p-2 shadow-md bg-[#2acb35] gap-2 "
          >
            <div className="px-2 py-2 rounded-md bg-gray-100 flex items-center justify-between text-xs font-medium">
              <span className="truncate max-w-[110px]">{_id}</span>
              <FiCopy onClick={handleCopy} className="cursor-pointer text-gray-600 hover:text-[#2acb35] text-xl" />
            </div>
            {copied && (
              <p className="text-xs text-white font-semibold px-2 -mt-1 mb-1">ID Copied!</p>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById(`edit_modal_${_id}`).showModal();
              }}
              className="btn text-sm font-semibold text-gray-700 hover:bg-green-100 hover:text-[#2acb35] transition-all duration-200 rounded-md hover:scale-105"
            >
              Edit <RiEdit2Fill className='ml-1 -mt-1 text-xl ' />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBlogDelete(_id);
              }}
              className="btn text-sm font-semibold text-gray-700 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-md hover:scale-105"
            >
              Delete <RiDeleteBin6Line className='ml-1 -mt-1 text-xl' />
            </button>
          </ul>
        </div>
      }

      <div
        ref={ref}
        className={`absolute inset-0 flex flex-col justify-between text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
      >
        {user && isAdmin ? (
          // Admin হলে category top-left এ
          <div className="absolute top-3 left-3 z-20">
            <div className="text-white text-xs px-4 py-2 border border-white rounded-full backdrop-blur-sm">
              {blogCategory}
            </div>
          </div>
        ) : (
          <>
            {/* Admin না হলে date top-left এ */}
            <div className="absolute top-3 left-3 z-20">
              <div className="text-white text-sm px-4 py-2 rounded-full backdrop-blur-sm">
                {blogDate}
              </div>
            </div>

            {/* Admin না হলে category top-right এ */}
            <div className="absolute top-3 right-3 z-20">
              <div className="text-white text-xs px-4 py-2 border border-white rounded-full backdrop-blur-sm">
                {blogCategory}
              </div>
            </div>
          </>
        )}

        <div className="flex-grow flex flex-col justify-center">
          <h2 className="text-xl font-bold mt-3 mb-2 drop-shadow-sm text-left">
            {highlightText(blogTitle, searchTerm)}
          </h2>
          <p
            className="text-sm group-hover:font-medium leading-relaxed drop-shadow-sm transition-all duration-300 text-left overflow-hidden text-ellipsis"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {highlightText(blogShortDescription, searchTerm)}
          </p>
        </div>

        <div>
          <button
            className="w-full py-1 border border-white text-white rounded-md transition-all duration-300 hover:scale-105 hover:font-semibold hover:border-[#2acb35]"
          >
            See More
          </button>
        </div>
      </div>

      <dialog id={`edit_modal_${_id}`} className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-box w-11/12 max-w-2xl">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              <ImCross />
            </button>
          </form>
          <p className="text-2xl font-semibold mb-5 text-center">
            Edit your <span className="text-[#2acb35]">blog</span>
          </p>

          <form onSubmit={handleBlogUpdate} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="blogTitle"
                value={formData.blogTitle}
                onChange={e => setFormData({ ...formData, blogTitle: e.target.value })}
                placeholder="blog Title"
                className="w-full p-3 border rounded-md"
                required
              />
              <select
                name="blogCategory"
                value={formData.blogCategory}
                onChange={e => setFormData({ ...formData, blogCategory: e.target.value })}
                required
                className="w-full p-3 border rounded-md"
              >
                <option value="" disabled>Choose Blog Category</option>
                <option value="Adventure Diary">Adventure Diary</option>
                <option value="Daily Notes">Daily Notes</option>
                <option value="Smart Resource">Smart Resource</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="file"
                className="file-input w-full file-input-ghost"
                accept="image/*"
                onChange={e => setNewImageFile(e.target.files[0])}
              />

              <input
                type="text"
                name="blogRandom"
                value={formData.blogRandom}
                onChange={e => setFormData({ ...formData, blogRandom: e.target.value })}
                placeholder="blog Random"
                className="w-full p-3 border rounded-md"
                required
              />
            </div>

            <textarea
              rows="4"
              name="blogShortDescription"
              value={formData.blogShortDescription}
              onChange={e => setFormData({ ...formData, blogShortDescription: e.target.value })}
              placeholder="blog Description..."
              className="w-full p-3 border rounded-md"
              required
            ></textarea>

            <button type="submit" className="btn w-full bg-[#2acb35] text-white font-semibold py-3 rounded-full hover:bg-[#59ca59] transition duration-300">
              Update blog
            </button>
          </form>
        </div>
      </dialog>
    </div>
  );
};

export default AdventureBlog;
