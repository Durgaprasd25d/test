const mongoose = require('mongoose');
const Category = require('../models/Category');
const Service = require('../models/Service');

const initialData = [
    {
        name: 'Repair',
        slug: 'repair',
        icon: 'build-outline',
        services: [
            {
                name: 'Gas Leak Fix',
                price: 1500,
                time: '2 hrs',
                description: 'Expert fixing of gas leaks in AC units.',
                image: 'https://images.unsplash.com/photo-1542013936693-884638332154?q=80&w=400&auto=format&fit=crop'
            },
            {
                name: 'Cooling Issue',
                price: 800,
                time: '1 hr',
                description: 'Restoring optimal cooling to your air conditioner.',
                image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7bc3?q=80&w=400&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Service',
        slug: 'service',
        icon: 'color-filter-outline',
        services: [
            {
                name: 'Deep Cleaning',
                price: 1200,
                time: '1.5 hrs',
                description: 'Thorough chemical cleaning of indoor and outdoor units.',
                image: 'https://images.unsplash.com/photo-1621905252507-b354bc2addcc?q=80&w=400&auto=format&fit=crop'
            },
            {
                name: 'Standard Checkup',
                price: 500,
                time: '30 mins',
                description: 'Routine maintenance and performance check.',
                image: 'https://images.unsplash.com/photo-1590333746438-281fd6f966fd?q=80&w=400&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Install',
        slug: 'install',
        icon: 'settings-outline',
        services: [
            {
                name: 'Unit Installation',
                price: 2500,
                time: '3 hrs',
                description: 'Professional installation of new AC units.',
                image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?q=80&w=400&auto=format&fit=crop'
            }
        ]
    },
    {
        name: 'Emergency',
        slug: 'emergency',
        icon: 'flash-outline',
        services: [
            {
                name: 'Fast Repair',
                price: 2000,
                time: '45 mins',
                description: 'Priority emergency repair for critical issues.',
                image: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=400&auto=format&fit=crop'
            }
        ]
    }
];

const seedDatabase = async () => {
    // 1. Seed Categories & Services
    try {
        const Category = require('../models/Category');
        const Service = require('../models/Service');

        const categoryCount = await Category.countDocuments();
        if (categoryCount === 0) {
            console.log('🌱 Seeding services and categories...');
            for (const catData of initialData) {
                const { services, ...categoryInfo } = catData;
                const category = await Category.create(categoryInfo);

                const servicesToCreate = services.map(s => ({
                    ...s,
                    category: category._id
                }));

                await Service.insertMany(servicesToCreate);
                console.log(`✅ Seeded Category: ${category.name} with ${servicesToCreate.length} services.`);
            }
            console.log('✨ Service seeding completed!');
        } else {
            console.log('ℹ️ Categories already exist, skipping service seed.');
        }
    } catch (error) {
        console.error('❌ Error seeding services:', error);
    }

    // 2. Seed Admin User
    try {
        const User = require('../models/User');
        const adminFound = await User.findOne({ role: 'admin' });
        const mobileAdminFound = await User.findOne({ mobile: 'admin' });

        if (!adminFound && !mobileAdminFound) {
            console.log('🛡️ Creating default Admin user...');
            await User.create({
                name: 'Super Admin',
                mobile: 'admin',
                password: 'admin',
                role: 'admin',
                isActive: true
            });
            console.log('✅ Default Admin created: admin / admin');
        } else {
            console.log('ℹ️ Admin user already exists:', {
                roleAdmin: adminFound?.mobile,
                mobileAdmin: mobileAdminFound?.mobile
            });
        }
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
    }
};

module.exports = seedDatabase;
