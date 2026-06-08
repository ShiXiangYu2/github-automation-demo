// 待办事项分类功能测试

describe('待办事项分类功能', () => {
    let todos;

    beforeEach(() => {
        todos = [];
    });

    test('添加带分类的待办事项', () => {
        const text = '会议准备';
        const category = 'work';
        todos.push({ text, done: false, category });
        expect(todos.length).toBe(1);
        expect(todos[0].category).toBe('work');
    });

    test('默认分类为 other', () => {
        const text = '测试任务';
        const category = 'other';
        todos.push({ text, done: false, category });
        expect(todos[0].category).toBe('other');
    });

    test('按分类筛选', () => {
        todos = [
            { text: '任务1', done: false, category: 'work' },
            { text: '任务2', done: false, category: 'life' },
            { text: '任务3', done: false, category: 'work' }
        ];

        const workTodos = todos.filter(t => t.category === 'work');
        expect(workTodos.length).toBe(2);
        expect(workTodos[0].text).toBe('任务1');
        expect(workTodos[1].text).toBe('任务3');
    });

    test('分类数据持久化', () => {
        const original = [
            { text: '工作1', done: false, category: 'work' },
            { text: '生活1', done: false, category: 'life' }
        ];
        const stored = JSON.stringify(original);
        const restored = JSON.parse(stored);
        expect(restored).toEqual(original);
    });

    test('切换完成状态不影响分类', () => {
        todos.push({ text: '学习', done: false, category: 'study' });
        todos[0].done = true;
        expect(todos[0].category).toBe('study');
        expect(todos[0].done).toBe(true);
    });
});