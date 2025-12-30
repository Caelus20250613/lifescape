/**
 * 教育費の目安データ (年額 / 円)
 */
export const EDUCATION_COURSES = {
    ALL_PUBLIC: {
        id: 'ALL_PUBLIC',
        name: '全て公立',
        description: '小・中・高・国立大学すべて公立',
        costs: { elem: 450000, middle: 480000, high: 450000, uni: 650000 }
    },
    PRIVATE_HIGH_UNI: {
        id: 'PRIVATE_HIGH_UNI',
        name: '高校から私立',
        description: '高校・私立大学(文系)を選択',
        costs: { elem: 450000, middle: 480000, high: 1000000, uni: 1100000 }
    },
    PRIVATE_SECONDARY: {
        id: 'PRIVATE_SECONDARY',
        name: '中学から私立',
        description: '中学・高校私立、大学国立',
        costs: { elem: 450000, middle: 1400000, high: 1000000, uni: 650000 }
    },
    PRIVATE_UNI_SCIENCE: {
        id: 'PRIVATE_UNI_SCIENCE',
        name: '大学私立理系',
        description: '大学のみ私立理系、他は公立',
        costs: { elem: 450000, middle: 480000, high: 450000, uni: 1600000 }
    },
    ALL_PRIVATE: {
        id: 'ALL_PRIVATE',
        name: '全て私立',
        description: '小学校から私立大学(文系)まで',
        costs: { elem: 1600000, middle: 1400000, high: 1000000, uni: 1100000 }
    }
};

/**
 * 年齢に応じた教育費を取得する
 * @param {string} courseId コースID
 * @param {number} age 年齢
 * @returns {number} 年間の教育費
 */
export const getAnnualEducationCost = (courseId, age) => {
    const course = EDUCATION_COURSES[courseId] || EDUCATION_COURSES.ALL_PUBLIC;

    if (age >= 7 && age <= 12) return course.costs.elem;
    if (age >= 13 && age <= 15) return course.costs.middle;
    if (age >= 16 && age <= 18) return course.costs.high;
    if (age >= 19 && age <= 22) return course.costs.uni;

    return 0;
};
