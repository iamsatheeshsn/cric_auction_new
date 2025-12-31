import React from 'react';
import Layout from '../components/Layout';
import SocialCardGenerator from '../components/social/SocialCardGenerator';

const SocialMediaTools = () => {
    return (
        <Layout>
            <div className="h-[calc(100vh-80px)]">
                <div className="mb-4">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Social Media Studio</h1>
                    <p className="text-slate-500">Generate professional match graphics.</p>
                </div>
                <SocialCardGenerator />
            </div>
        </Layout>
    );
};

export default SocialMediaTools;
