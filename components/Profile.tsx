import React, { useState, useRef } from 'react';
import { UserProfile, Language } from '../types';
import { User as UserIcon, Camera, Save, LogOut, Loader2 } from 'lucide-react';

interface ProfileProps {
  profile: UserProfile | null;
  onUpdate: (data: Partial<UserProfile>) => Promise<void>;
  onSignOut: () => void;
  lang: Language;
  t: any;
}

const Profile: React.FC<ProfileProps> = ({ profile, onUpdate, onSignOut, lang, t }) => {
  const [name, setName] = useState(profile?.name || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (limit to 1MB for profile pics)
    if (file.size > 1024 * 1024) {
      alert(lang === 'ar' ? 'حجم الصورة كبير جداً (الأقصى ١ ميجابايت)' : 'Image too large (Max 1MB)');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdate({ name, photoURL });
      alert(lang === 'ar' ? 'تم تحديث الملف الشخصي!' : 'Profile updated successfully!');
    } catch (e) {
      alert(lang === 'ar' ? 'حدث خطأ ما' : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-100 relative">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600 bg-blue-100">
                  <UserIcon size={48} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="text-white animate-spin" size={24} />
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-90"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
            />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-6">{profile?.email}</h2>
          <p className="text-sm font-bold text-slate-400 font-mono mt-1">UID: {profile?.uid.slice(0, 8)}...</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t.full_name}</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              placeholder={t.full_name}
            />
          </div>

          <button 
            type="submit" 
            disabled={saving || uploading}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-100 uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.update_profile}
          </button>
        </form>

        <div className="pt-8 border-t border-slate-100">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-50 transition-all border border-rose-100"
          >
            <LogOut size={20} />
            {lang === 'ar' ? 'تسجيل الخروج' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
