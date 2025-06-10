// // src/Pages/Blog/BlogEditor.jsx

// import React, { useState } from 'react';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// const BlogEditor = () => {
//   const [title, setTitle] = useState('');
//   const [content, setContent] = useState('');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     const blog = { title, content };
//     console.log(blog);
//     // এখানে চাইলে axios দিয়ে backend এ পাঠাতে পারো
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">✍️ Create a Blog</h2>

//       <form onSubmit={handleSubmit}>
//         <input
//           type="text"
//           placeholder="Enter blog title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded mb-4"
//         />

//         <ReactQuill
//           value={content}
//           onChange={setContent}
//           className="mb-4"
//           theme="snow"
//         />

//         <button
//           type="submit"
//           className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           Publish
//         </button>
//       </form>
//     </div>
//   );
// };

// export default BlogEditor;
