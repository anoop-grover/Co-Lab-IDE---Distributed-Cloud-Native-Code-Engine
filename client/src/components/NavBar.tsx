import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../app/slices/authSlice";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
  const token = useAppSelector((state) => { return state.auth.token });
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  const currentPath = location.pathname;
  const navigation = [
    { name: "Home", href: "/", current: currentPath === "/" },
    {
      name: "Code",
      href: "/sandbox/create",
      current: currentPath.includes("sandbox"),
    },
    {
      name: "Collaboration",
      href: "/collab",
      current: currentPath.includes("collab"),
    },
  ];

  return (
    <Disclosure as="nav" className="bg-slate-900 border-b border-slate-800">
      {({ open }: { open: any }) => (
        <>
          <div className="px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button*/}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Co-Lab IDE</h1>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={classNames(
                          item.current
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                            : "text-gray-300 hover:bg-slate-800 hover:text-white",
                          "rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {token && (
                  <div>
                    <button
                      onClick={() => {
                        dispatch(logout())
                      }}
                      type="button"
                      className="text-red-400 hover:text-white border border-red-500/30 hover:bg-red-600 focus:ring-4 focus:outline-none focus:ring-red-950 font-medium rounded-lg text-sm px-4 py-1.5 text-center transition-all duration-200"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  to={item.href}
                  className={classNames(
                    item.current
                      ? "bg-indigo-600 text-white"
                      : "text-gray-300 hover:bg-slate-800 hover:text-white",
                    "block rounded-md px-3 py-2 text-base font-semibold"
                  )}
                  aria-current={item.current ? "page" : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
