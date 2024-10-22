import React from 'react';

const GeneralTab = ({ profile, formData, handleChange, handleSubmit, isEditing, setIsEditing }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-4">General Information</h2>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio</label>
            <textarea
              name="bio"
              id="bio"
              value={formData.bio}
              onChange={handleChange}
              rows="3"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            ></textarea>
          </div>
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-300">Business Name</label>
            <input
              type="text"
              name="businessName"
              id="businessName"
              value={formData.businessName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="businessPhone" className="block text-sm font-medium text-gray-300">Business Phone</label>
            <input
              type="tel"
              name="businessPhone"
              id="businessPhone"
              value={formData.businessPhone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="businessWebsite" className="block text-sm font-medium text-gray-300">Business Website</label>
            <input
              type="url"
              name="businessWebsite"
              id="businessWebsite"
              value={formData.businessWebsite}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div>
            <label htmlFor="businessAddress" className="block text-sm font-medium text-gray-300">Business Address</label>
            <input
              type="text"
              name="businessAddress"
              id="businessAddress"
              value={formData.businessAddress}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p><strong>Name:</strong> {profile.user.name}</p>
          <p><strong>Email:</strong> {profile.user.email}</p>
          <p><strong>Bio:</strong> {profile.bio || 'No bio provided'}</p>
          <p><strong>Business Name:</strong> {profile.user.businessInfo?.name || 'Not provided'}</p>
          <p><strong>Business Phone:</strong> {profile.user.businessInfo?.phone || 'Not provided'}</p>
          <p><strong>Business Website:</strong> {profile.user.businessInfo?.website || 'Not provided'}</p>
          <p><strong>Business Address:</strong> {profile.user.businessInfo?.address || 'Not provided'}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default GeneralTab;