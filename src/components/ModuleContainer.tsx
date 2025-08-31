
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import PreProduction from './modules/PreProduction';
import PostProduction from './modules/PostProduction';
import Billing from './modules/Billing';
import Database from './modules/Database';

const ModuleContainer: React.FC = () => {
  const { activeModule } = useAppContext();
  
  return (
    <>
      {activeModule === 'pre-production' && <PreProduction />}
      {activeModule === 'post-production' && <PostProduction />}
      {activeModule === 'billing' && <Billing />}
      {activeModule === 'database' && <Database />}
    </>
  );
};

export default ModuleContainer;
