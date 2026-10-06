"use client";

import { useState } from "react";

export default function ComplaintRegistration() {
  const [description, setDescription] = useState("");
  const [isListening, setIsListening] = useState(false);

  const [photo, setPhoto] = useState<string | null>(null);

  // Voice to text
  const startVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const voiceText = event.results[0][0].transcript;

      setDescription((previous) => {
        if (previous.trim() === "") {
          return voiceText;
        }

        return previous + " " + voiceText;
      });
    };

    recognition.onerror = () => {
      alert("Unable to capture voice. Please try again.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };


  // Photo upload
  const handlePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const imageURL = URL.createObjectURL(file);

    setPhoto(imageURL);
  };


  // Remove photo
  const removePhoto = () => {
    setPhoto(null);
  };


  // Submit form
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    alert("Complaint submitted successfully!");
  };


  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-blue-700 px-6 py-5 text-white shadow">
        <div className="mx-auto max-w-6xl">

          <h1 className="text-2xl font-bold">
            CivicCare
          </h1>

          <p className="text-sm text-blue-100">
            Civic Complaint Management System
          </p>

        </div>
      </header>


      {/* Main Content */}
      <section className="px-6 py-10">

        <div className="mx-auto max-w-4xl">

          {/* Page Heading */}
          <div className="mb-8">

            <h2 className="text-3xl font-bold text-gray-900">
              Register a Complaint
            </h2>

            <p className="mt-2 text-gray-600">
              Provide the details of the civic issue you want to report.
            </p>

          </div>


          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >

            {/* ================================================= */}
            {/* 1. LOCATION */}
            {/* ================================================= */}

            <section className="rounded-xl bg-white p-6 shadow">

              <h3 className="mb-1 text-xl font-bold text-gray-900">
                1. Complaint Location
              </h3>

              <p className="mb-6 text-sm text-gray-500">
                Enter the location where the civic issue occurred.
              </p>


              {/* District + Taluka */}
              <div className="grid gap-5 md:grid-cols-2">

                {/* District */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    District
                  </label>

                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
                  >

                    <option value="">
                      Select District
                    </option>

                    <option value="pune">
                      Pune
                    </option>

                    <option value="mumbai">
                      Mumbai
                    </option>

                    <option value="nashik">
                      Nashik
                    </option>

                    <option value="nagpur">
                      Nagpur
                    </option>

                  </select>

                </div>


                {/* Taluka */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Taluka
                  </label>

                  <select
                    required
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus:border-blue-600 focus:outline-none"
                  >

                    <option value="">
                      Select Taluka
                    </option>

                    <option value="haveli">
                      Haveli
                    </option>

                    <option value="mulshi">
                      Mulshi
                    </option>

                    <option value="maval">
                      Maval
                    </option>

                    <option value="bhor">
                      Bhor
                    </option>

                  </select>

                </div>

              </div>


              {/* Village */}
              <div className="mt-5">

                <label className="mb-2 block font-medium text-gray-700">
                  Village / Area
                </label>

                <input
                  type="text"
                  placeholder="Enter village or area"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />

              </div>


              {/* Landmark */}
              <div className="mt-5">

                <label className="mb-2 block font-medium text-gray-700">
                  Landmark
                </label>

                <input
                  type="text"
                  placeholder="Example: Near school, bus stop, temple..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />

              </div>


              {/* Map */}
              <div className="mt-6">

                <label className="mb-2 block font-medium text-gray-700">
                  Map Location
                </label>

                <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-100">

                  <div className="text-center">

                    <div className="text-5xl">
                      📍
                    </div>

                    <p className="mt-3 font-medium text-gray-700">
                      Map Integration
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Select the exact complaint location on the map.
                    </p>

                    <button
                      type="button"
                      className="mt-4 rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                      onClick={() =>
                        alert("Map integration will be added next.")
                      }
                    >
                      Select Location
                    </button>

                  </div>

                </div>

              </div>

            </section>


            {/* ================================================= */}
            {/* 2. CITIZEN DETAILS */}
            {/* ================================================= */}

            <section className="rounded-xl bg-white p-6 shadow">

              <h3 className="mb-1 text-xl font-bold text-gray-900">
                2. Citizen Details
              </h3>

              <p className="mb-6 text-sm text-gray-500">
                Enter your contact information.
              </p>


              <div className="grid gap-5 md:grid-cols-2">

                {/* Name */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter your name"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />

                </div>


                {/* Contact */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Contact Number
                  </label>

                  <input
                    type="tel"
                    placeholder="Enter mobile number"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />

                </div>


                {/* Date */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Date
                  </label>

                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />

                </div>


                {/* Time */}
                <div>

                  <label className="mb-2 block font-medium text-gray-700">
                    Time
                  </label>

                  <input
                    type="time"
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />

                </div>

              </div>

            </section>


            {/* ================================================= */}
            {/* 3. COMPLAINT DESCRIPTION */}
            {/* ================================================= */}

            <section className="rounded-xl bg-white p-6 shadow">

              <h3 className="mb-1 text-xl font-bold text-gray-900">
                3. Complaint Description
              </h3>

              <p className="mb-6 text-sm text-gray-500">
                Describe the civic problem using text or your voice.
              </p>


              {/* Text Description */}
              <label className="mb-2 block font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the problem in detail..."
                required
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
              />


              {/* Voice Button */}
              <div className="mt-4">

                <button
                  type="button"
                  onClick={startVoiceInput}
                  className={`rounded-lg px-5 py-3 font-semibold text-white ${
                    isListening
                      ? "bg-red-600"
                      : "bg-blue-700 hover:bg-blue-800"
                  }`}
                >

                  {isListening
                    ? "🔴 Listening..."
                    : "🎤 Speak Complaint"}

                </button>

                <p className="mt-2 text-sm text-gray-500">
                  Click the button and speak your complaint.
                  Your voice will be converted into text.
                </p>

              </div>

            </section>


            {/* ================================================= */}
            {/* 4. PHOTO */}
            {/* ================================================= */}

            <section className="rounded-xl bg-white p-6 shadow">

              <h3 className="mb-1 text-xl font-bold text-gray-900">
                4. Photo of the Issue
              </h3>

              <p className="mb-6 text-sm text-gray-500">
                Upload a photo showing the civic problem.
              </p>


              {!photo && (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 hover:bg-gray-100">

                  <div className="text-5xl">
                    📷
                  </div>

                  <p className="mt-3 font-semibold text-gray-700">
                    Upload Photo
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    PNG, JPG or JPEG
                  </p>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />

                </label>
              )}


              {/* Photo Preview */}
              {photo && (
                <div className="relative">

                  <img
                    src={photo}
                    alt="Complaint"
                    className="max-h-80 w-full rounded-xl object-contain"
                  />


                  {/* Edit / Remove */}
                  <div className="mt-4 flex gap-3">

                    <label className="cursor-pointer rounded-lg bg-blue-700 px-5 py-2 font-semibold text-white hover:bg-blue-800">

                      ✏️ Edit Photo

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />

                    </label>


                    <button
                      type="button"
                      onClick={removePhoto}
                      className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
                    >
                      🗑️ Remove
                    </button>

                  </div>

                </div>
              )}

            </section>


            {/* ================================================= */}
            {/* 5. CONFIRMATION */}
            {/* ================================================= */}

            <section className="rounded-xl bg-white p-6 shadow">

              <label className="flex items-start gap-3">

                <input
                  type="checkbox"
                  required
                  className="mt-1 h-5 w-5"
                />

                <span className="text-sm text-gray-700">
                  I confirm that the information provided
                  in this complaint is correct.
                </span>

              </label>

            </section>


            {/* Submit */}
            <div className="flex justify-end gap-4">

              <button
                type="button"
                onClick={() => window.history.back()}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-8 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Submit Complaint
              </button>

            </div>

          </form>

        </div>

      </section>

    </main>
  );
}