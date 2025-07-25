export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-700 italic mb-4">
            UpgradeMate - Because enterprise Windows upgrades shouldn't be this hard.
          </p>
          <p className="text-gray-600">
            &copy; {new Date().getFullYear()} UpgradeMate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}