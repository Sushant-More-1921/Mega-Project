<<<<<<< Updated upstream
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth/citizenlogin");
}
=======
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold text-blue-700">
              CivicCare
            </h1>

            <p className="text-sm text-gray-500">
              Civic Complaint Management System
            </p>
          </div>

          {/* Navigation */}
          <div className="flex gap-4">

            <a
              href="/complaints/track"
              className="px-4 py-2 text-gray-700 hover:text-blue-700"
            >
              Track Complaint
            </a>

            <a
              href="/login"
              className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800"
            >
              Login
            </a>

          </div>

        </div>
      </nav>


      {/* Hero Section */}
      <section className="bg-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-6 py-20">

          <h2 className="text-4xl font-bold md:text-5xl">
            Report Civic Issues
          </h2>

          <p className="mt-5 max-w-2xl text-lg text-blue-100">
            Report problems such as potholes, garbage,
            water supply, drainage and street lights
            directly to the concerned department.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex gap-4">

            <a
              href="/complaints/new"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-gray-100"
            >
              Register Complaint
            </a>

            <a
              href="/complaints/track"
              className="rounded-lg border border-white px-6 py-3 font-semibold hover:bg-blue-600"
            >
              Track Complaint
            </a>

          </div>

        </div>
      </section>


      {/* Statistics */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        <h2 className="mb-8 text-center text-3xl font-bold">
          Complaint Statistics
        </h2>

        <div className="grid gap-6 md:grid-cols-4">

          {/* Total */}
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <h3 className="text-3xl font-bold text-blue-700">
              12540
            </h3>

            <p className="mt-2 text-gray-600">
              Total Complaints
            </p>
          </div>


          {/* Resolved */}
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <h3 className="text-3xl font-bold text-green-600">
              8955
            </h3>

            <p className="mt-2 text-gray-600">
              Resolved
            </p>
          </div>


          {/* Progress */}
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <h3 className="text-3xl font-bold text-yellow-600">
              2340
            </h3>

            <p className="mt-2 text-gray-600">
              In Progress
            </p>
          </div>


          {/* Pending */}
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <h3 className="text-3xl font-bold text-red-600">
              1245
            </h3>

            <p className="mt-2 text-gray-600">
              Pending
            </p>
          </div>

        </div>

      </section>


      {/* Complaint Categories */}
      <section className="bg-white py-16">

        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-center text-3xl font-bold">
            Complaint Categories
          </h2>

          <p className="mt-3 text-center text-gray-600">
            Select the type of civic problem you want to report.
          </p>


          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

            <Category
              icon="🛣️"
              title="Road & Potholes"
              description="Report damaged roads and potholes."
            />

            <Category
              icon="🗑️"
              title="Garbage"
              description="Report garbage collection problems."
            />

            <Category
              icon="💧"
              title="Water Supply"
              description="Report water supply issues."
            />

            <Category
              icon="💡"
              title="Street Lights"
              description="Report damaged street lights."
            />

            <Category
              icon="🚰"
              title="Drainage"
              description="Report drainage problems."
            />

            <Category
              icon="⚡"
              title="Electricity"
              description="Report public electricity issues."
            />

            <Category
              icon="🏥"
              title="Public Health"
              description="Report public health problems."
            />

            <Category
              icon="📋"
              title="Other"
              description="Report other civic problems."
            />

          </div>

        </div>

      </section>


      {/* How It Works */}
      <section className="bg-gray-50 py-16">

        <div className="mx-auto max-w-7xl px-6">

          <h2 className="text-center text-3xl font-bold">
            How It Works
          </h2>


          <div className="mt-10 grid gap-8 md:grid-cols-4">

            <Step
              number="1"
              title="Register"
              description="Create your citizen account."
            />

            <Step
              number="2"
              title="Submit"
              description="Submit your civic complaint."
            />

            <Step
              number="3"
              title="Track"
              description="Track the status of your complaint."
            />

            <Step
              number="4"
              title="Resolve"
              description="The concerned department resolves the issue."
            />

          </div>

        </div>

      </section>


      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-center text-white">

        <h2 className="text-xl font-bold">
          CivicCare
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Civic Complaint Management System
        </p>

        <p className="mt-4 text-xs text-gray-500">
          © 2026 CivicCare. All rights reserved.
        </p>

      </footer>

    </main>
  );
}


/* Category Component */

function Category({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-lg">

      <div className="text-4xl">
        {icon}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>

    </div>
  );
}


/* How It Works Component */

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-xl font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-600">
        {description}
      </p>

    </div>
  );
}
>>>>>>> Stashed changes
