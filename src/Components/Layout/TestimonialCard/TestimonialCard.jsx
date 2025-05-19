import { FaGlobe, FaRecycle, FaTree } from 'react-icons/fa';

const ProcessCard = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-md transition duration-300 transform hover:scale-105 group">
    <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-2 border-[#2acb35] mb-4">
      <Icon className="text-[#2acb35] text-3xl z-10" />
      <div className="absolute animate-spin-slow">
        <div className="w-3 h-3 bg-[#2acb35] rounded-full shadow-md orbit-dot" />
      </div>
    </div>
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-600 mt-2">{description}</p>
  </div>
);

const EnvironmentalProcess = () => {
  const steps = [
    {
      icon: FaGlobe,
      title: 'Collection Dust',
      description:
        'Proactively drive maintainable value next mission-critical infrastructures eggplant new environmental nature',
    },
    {
      icon: FaRecycle,
      title: 'Dust Recycling',
      description:
        'Proactively drive maintainable value next mission-critical infrastructures eggplant new environmental nature',
    },
    {
      icon: FaTree,
      title: 'Cleaning Environment',
      description:
        'Proactively drive maintainable value next mission-critical infrastructures eggplant new environmental nature',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Inline keyframes and custom classes */}
      <style>
        {`
          @keyframes spin-slow {
            0% {
              transform: rotate(0deg) translateX(35px) rotate(0deg);
            }
            100% {
              transform: rotate(360deg) translateX(35px) rotate(-360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 4s linear infinite;
          }
          .orbit-dot {
            width: 10px;
            height: 10px;
            background-color: #2acb35;
            border-radius: 9999px;
          }
        `}
      </style>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {steps.map((step, index) => (
          <ProcessCard
            key={index}
            icon={step.icon}
            title={step.title}
            description={step.description}
          />
        ))}
      </div>
    </div>
  );
};

export default EnvironmentalProcess;
