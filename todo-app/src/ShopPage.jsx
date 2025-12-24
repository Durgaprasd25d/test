import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Heart, Star, TrendingUp, Zap, Gift, Truck, Shield, Tag, ChevronRight, Menu, X, User, ArrowRight } from 'lucide-react';

function ShopPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);

    // Product categories
    const categories = [
        { name: 'All', icon: '🛍️' },
        { name: 'Electronics', icon: '📱' },
        { name: 'Fashion', icon: '👗' },
        { name: 'Home & Kitchen', icon: '🏠' },
        { name: 'Beauty', icon: '💄' },
        { name: 'Sports', icon: '⚽' },
        { name: 'Books', icon: '📚' },
        { name: 'Toys', icon: '🎮' }
    ];

    // Featured products
    const products = [
        { id: 1, name: 'Premium Wireless Headphones', price: 2999, originalPrice: 4999, rating: 4.5, reviews: 1254, image: '🎧', discount: 40, category: 'Electronics', tag: 'Bestseller' },
        { id: 2, name: 'Smart Watch Series X', price: 4999, originalPrice: 7999, rating: 4.7, reviews: 856, image: '⌚', discount: 38, category: 'Electronics', tag: 'Trending' },
        { id: 3, name: 'Designer Handbag', price: 1999, originalPrice: 3999, rating: 4.3, reviews: 432, image: '👜', discount: 50, category: 'Fashion', tag: 'Hot Deal' },
        { id: 4, name: 'Running Shoes Pro', price: 3499, originalPrice: 5999, rating: 4.6, reviews: 2341, image: '👟', discount: 42, category: 'Sports', tag: 'Bestseller' },
        { id: 5, name: 'Coffee Maker Deluxe', price: 2499, originalPrice: 3999, rating: 4.4, reviews: 678, image: '☕', discount: 38, category: 'Home & Kitchen', tag: 'New' },
        { id: 6, name: 'Skincare Premium Set', price: 1799, originalPrice: 2999, rating: 4.8, reviews: 1523, image: '🧴', discount: 40, category: 'Beauty', tag: 'Hot Deal' },
        { id: 7, name: 'Gaming Controller RGB', price: 1299, originalPrice: 1999, rating: 4.5, reviews: 934, image: '🎮', discount: 35, category: 'Toys', tag: 'Trending' },
        { id: 8, name: 'Bestseller Book Collection', price: 899, originalPrice: 1499, rating: 4.9, reviews: 3421, image: '📚', discount: 40, category: 'Books', tag: 'Bestseller' }
    ];

    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    const addToCart = (product) => {
        setCart([...cart, product]);
        showNotification('Added to cart!');
    };

    const toggleWishlist = (productId) => {
        if (wishlist.includes(productId)) {
            setWishlist(wishlist.filter(id => id !== productId));
        } else {
            setWishlist([...wishlist, productId]);
            showNotification('Added to wishlist!');
        }
    };

    const showNotification = (message) => {
        // Simple notification animation
        const notification = document.createElement('div');
        notification.className = 'fixed top-24 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-slide-in';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 pt-20">
            {/* Top Header Bar */}
            <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2 z-40">
                <div className="container mx-auto px-4 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer">
                            <Truck className="w-4 h-4" /> Free Delivery on orders above ₹499
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="hover:scale-105 transition-transform cursor-pointer">Download App</span>
                        <span className="hover:scale-105 transition-transform cursor-pointer">Become a Seller</span>
                    </div>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="fixed top-10 left-0 right-0 bg-white shadow-lg z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
                                ShopHaven
                            </div>
                            <span className="text-xs text-gray-500 italic">Explore Plus+</span>
                        </div>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl relative group">
                            <input
                                type="text"
                                placeholder="Search for products, brands and more..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-6 py-3 rounded-lg bg-blue-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all duration-300"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-6">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-lg transition-all hover:scale-105">
                                <User className="w-5 h-5 text-gray-700" />
                                <span className="font-medium text-gray-700">Login</span>
                            </button>
                            <button className="relative hover:scale-110 transition-transform">
                                <Heart className="w-6 h-6 text-gray-700" />
                                {wishlist.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                        {wishlist.length}
                                    </span>
                                )}
                            </button>
                            <button className="relative hover:scale-110 transition-transform">
                                <ShoppingCart className="w-6 h-6 text-gray-700" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-32 pb-16">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-12 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse-subtle"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 animate-pulse-subtle"></div>

                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-bounce-subtle">
                            <Zap className="w-4 h-4 text-yellow-300" />
                            <span className="text-white text-sm font-semibold">Special Festive Sale</span>
                        </div>
                        <h1 className="text-6xl font-bold text-white mb-4 animate-fade-in">
                            Year End Sale
                        </h1>
                        <p className="text-2xl text-white/90 mb-8 animate-fade-in">
                            Get up to <span className="text-5xl font-bold text-yellow-300">70% OFF</span>
                        </p>
                        <p className="text-white/80 text-lg mb-8">
                            Discover amazing deals on your favorite products. Limited time offer!
                        </p>
                        <button className="group bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2">
                            Shop Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Banner */}
            <section className="container mx-auto px-4 mb-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { icon: Truck, title: 'Free Delivery', desc: 'On orders above ₹499', color: 'from-blue-500 to-cyan-500' },
                        { icon: Shield, title: 'Secure Payment', desc: '100% Protected', color: 'from-green-500 to-emerald-500' },
                        { icon: Gift, title: 'Special Offers', desc: 'Save up to 70%', color: 'from-purple-500 to-pink-500' },
                        { icon: TrendingUp, title: 'Best Prices', desc: 'Guaranteed Lowest', color: 'from-orange-500 to-red-500' }
                    ].map((feature, index) => (
                        <div key={index} className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                            <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h3>
                            <p className="text-gray-600 text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Categories Section */}
            <section className="container mx-auto px-4 mb-16">
                <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
                    Shop by Category
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {categories.map((category) => (
                        <button
                            key={category.name}
                            onClick={() => setActiveCategory(category.name)}
                            className={`flex-shrink-0 flex flex-col items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105 ${activeCategory === category.name
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl scale-105'
                                    : 'bg-white text-gray-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            <span className="text-4xl">{category.icon}</span>
                            <span className="font-semibold whitespace-nowrap">{category.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Products Grid */}
            <section className="container mx-auto px-4 mb-16">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">
                        {activeCategory === 'All' ? 'Featured Products' : activeCategory}
                    </h2>
                    <div className="flex items-center gap-2 text-blue-600 font-semibold cursor-pointer hover:gap-4 transition-all">
                        View All <ChevronRight className="w-5 h-5" />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredProducts.map((product, index) => (
                        <div
                            key={product.id}
                            className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            {/* Product Image */}
                            <div className="relative bg-gradient-to-br from-blue-100 to-purple-100 p-8 h-64 flex items-center justify-center overflow-hidden">
                                <div className="text-8xl group-hover:scale-110 transition-transform duration-300">
                                    {product.image}
                                </div>

                                {/* Wishlist Button */}
                                <button
                                    onClick={() => toggleWishlist(product.id)}
                                    className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition-transform"
                                >
                                    <Heart
                                        className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                                            }`}
                                    />
                                </button>

                                {/* Tag */}
                                <div className="absolute top-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {product.tag}
                                </div>

                                {/* Discount Badge */}
                                <div className="absolute bottom-4 left-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold">
                                    {product.discount}% OFF
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-6">
                                <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {product.name}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
                                        {product.rating}
                                        <Star className="w-3 h-3 fill-white" />
                                    </div>
                                    <span className="text-gray-500 text-sm">({product.reviews.toLocaleString()})</span>
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-3 mb-4">
                                    <span className="text-2xl font-bold text-gray-800">₹{product.price.toLocaleString()}</span>
                                    <span className="text-sm text-gray-400 line-through">₹{product.originalPrice.toLocaleString()}</span>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={() => addToCart(product)}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-5 h-5" />
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA Banner */}
            <section className="container mx-auto px-4 mb-16">
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-12 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                    <div className="relative z-10">
                        <h2 className="text-4xl font-bold text-white mb-4">Not Sure What to Buy?</h2>
                        <p className="text-white/90 text-lg mb-8">
                            Get personalized recommendations based on your preferences
                        </p>
                        <button className="bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            Take Our Quiz
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div>
                            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                ShopHaven
                            </h3>
                            <p className="text-gray-400">
                                Your one-stop destination for all your shopping needs.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">About</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li className="hover:text-white cursor-pointer transition-colors">Contact Us</li>
                                <li className="hover:text-white cursor-pointer transition-colors">About Us</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Press</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Help</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li className="hover:text-white cursor-pointer transition-colors">Payments</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Shipping</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Returns</li>
                                <li className="hover:text-white cursor-pointer transition-colors">FAQ</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">Policy</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li className="hover:text-white cursor-pointer transition-colors">Return Policy</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Terms of Use</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Security</li>
                                <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>© 2025 ShopHaven. All rights reserved. Made with ❤️ for shoppers</p>
                    </div>
                </div>
            </footer>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
        </div>
    );
}

export default ShopPage;
