import React from 'react';
import { Github, Twitter, MessageCircle } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between">
          {/* Description Section */}
          <div className="w-full md:w-2/3">
            <p className="mt-4 text-gray-300 text-sm">
              The quick brown fox jumps over the lazy dog. Beneath a silver moon, the waves crash gently against the shore, whispering secrets of the deep. Somewhere in a quiet forest, a single leaf flutters to the ground, marking the passage of time in nature's silent symphony.
            </p>
          </div>

          {/* Connect Section */}
          <div className="mt-8 md:mt-0 ml-auto">
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              Connect
            </h3>
            <div className="flex space-x-6 mt-4">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <MessageCircle className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-gray-700 pt-8">
          <p className="text-base text-gray-400 text-center">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
