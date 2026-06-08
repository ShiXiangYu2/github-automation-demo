// 待办事项逻辑测试

describe('待办事项逻辑', () => {
  let todos;

  beforeEach(() => {
    todos = [];
  });

  test('添加待办事项', () => {
    const text = '测试任务';
    todos.push({ text, done: false });
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('测试任务');
    expect(todos[0].done).toBe(false);
  });

  test('切换完成状态', () => {
    todos.push({ text: '任务1', done: false });
    todos[0].done = true;
    expect(todos[0].done).toBe(true);
  });

  test('删除待办事项', () => {
    todos.push({ text: '任务1', done: false });
    todos.push({ text: '任务2', done: false });
    todos.splice(0, 1);
    expect(todos.length).toBe(1);
    expect(todos[0].text).toBe('任务2');
  });

  test('localStorage 序列化和反序列化', () => {
    const original = [{ text: '任务1', done: false }, { text: '任务2', done: true }];
    const stored = JSON.stringify(original);
    const restored = JSON.parse(stored);
    expect(restored).toEqual(original);
  });
});