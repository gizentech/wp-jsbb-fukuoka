import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router = useRouter();
  
  useEffect(() => {
    // 外部URLへのリダイレクト
    window.location.href = 'https://wp.jsbb-fukuoka.com/wp-admin/';
  }, []);

  // リダイレクト中に表示する内容（ほぼ表示されない）
  return <div>リダイレクト中...</div>;
}