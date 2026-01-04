import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthHelpers';
import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SettingsPage() {
    const { currentUser } = useAuth();
    const [members, setMembers] = useState(['自分', '配偶者', '共通', '子供']);
    const [newMember, setNewMember] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!currentUser) return;
        try {
            const docRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
            const docSnap = await getDoc(docRef);
            if (docSnap.exists() && docSnap.data().members) {
                setMembers(docSnap.data().members);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => { fetchSettings(); }, [fetchSettings]);

    const handleSave = async (updatedMembers) => {
        if (!currentUser) return;
        setSaving(true);
        try {
            const docRef = doc(db, 'users', currentUser.uid, 'settings', 'general');
            await setDoc(docRef, {
                members: updatedMembers,
                updatedAt: serverTimestamp()
            }, { merge: true });
            setMembers(updatedMembers);
            alert("設定を保存しました");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("保存に失敗しました");
        } finally {
            setSaving(false);
        }
    };

    const addMember = () => {
        if (!newMember.trim()) return;
        if (members.includes(newMember.trim())) {
            alert("既に存在するメンバー名です");
            return;
        }
        const updated = [...members, newMember.trim()];
        handleSave(updated);
        setNewMember('');
    };

    const removeMember = (index) => {
        if (members.length <= 1) {
            alert("メンバーは最低1人必要です");
            return;
        }
        if (!window.confirm(`「${members[index]}」を削除しますか？`)) return;
        const updated = members.filter((_, i) => i !== index);
        handleSave(updated);
    };

    if (loading) return <div className="p-8 text-center">読み込み中...</div>;

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">設定</h1>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">家族メンバー設定</h2>
                <p className="text-sm text-gray-500 mb-6">
                    収支管理で使用するメンバー（所有者）を登録します。「自分」「配偶者」「子供」などを登録してください。
                </p>

                <div className="space-y-3 mb-6">
                    {members.map((member, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                            <span className="font-medium text-gray-700">{member}</span>
                            <button
                                onClick={() => removeMember(index)}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                削除
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMember}
                        onChange={(e) => setNewMember(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="新しいメンバー名"
                    />
                    <button
                        onClick={addMember}
                        disabled={saving || !newMember.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                        追加
                    </button>
                </div>
            </div>
        </div>
    );
}
