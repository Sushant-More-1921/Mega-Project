"use client";

import { FormEvent } from "react";

export default function RegisterPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert("Registration form submitted!");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-blue-700 px-6 py-5 text-white">
        <div className="mx-auto max-w-6xl">

          <h1 className="text-2xl font-bold">
            CivicCare
          </h1>

          <p className="text-sm text-blue-100">
            Civic Complaint Management System
          </p>

        </div>
      </header>


      {/* Registration Section */}
      <section className="px-6 py-12">

        <div className="mx-auto max-w-2xl">

          {/* Title */}
          <div className="mb-8 text-center">

            <h2 className="text-3xl font-bold text-gray-900">
              Create Citizen Account
            </h2>

            <p className="mt-2 text-gray-600">
              Register to submit and track civic complaints.
            </p>

          </div>


          {/* Registration Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-white p-8 shadow"
          >

            {/* Full Name */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Full Name
              </label>

              <input
                type="text"
                placeholder="Enter your full name"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Mobile Number */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Mobile Number
              </label>

              <input
                type="tel"
                placeholder="Enter your mobile number"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Email */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Email Address
              </label>

              <input
                type="email"
                placeholder="Enter your email"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Password */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Password
              </label>

              <input
                type="password"
                placeholder="Create a password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Confirm Password */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm your password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Address */}
            <div className="mb-5">

              <label className="mb-2 block font-medium text-gray-700">
                Address
              </label>

              <textarea
                placeholder="Enter your address"
                rows={3}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600"
              />

            </div>


            {/* Ward */}
            <div className="mb-6">

              <label className="mb-2 block font-medium text-gray-700">
                Ward
              </label>

              <select
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
              >

                <option value="">
                  Select your ward
                </option>

                <option value="ward-1">
                  Ward 1
                </option>

                <option value="ward-2">
                  Ward 2
                </option>

                <option value="ward-3">
                  Ward 3
                </option>

                <option value="ward-4">
                  Ward 4
                </option>

                <option value="ward-5">
                  Ward 5
                </option>

              </select>

            </div>


            {/* Submit Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800"
            >
              Create Account
            </button>


            {/* Login Link */}
            <p className="mt-6 text-center text-sm text-gray-600">

              Already have an account?

              <a
                href="/login"
                className="ml-1 font-semibold text-blue-700 hover:underline"
              >
                Login
              </a>

            </p>

          </form>

        </div>

      </section>

    </main>
  );
}