// 모든 DOM 요소가 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
    // 필요한 DOM 요소들 가져오기
    const apiStatusElement = document.getElementById("apiStatus");
    const todoInput = document.getElementById("todoInput");
    const todoDescription = document.getElementById("todoDescription");
    const addTodoButton = document.getElementById("addTodo");
    const todoList = document.getElementById("todoList");
    const emptyTodoMessage = document.getElementById("emptyTodoMessage");

    // API 기본 URL (백엔드 서버 주소)
    const API_URL = "/api";

    // --- 함수 정의 ---

    // 에러 메시지 표시
    function displayError(message, error) {
        console.error(message, error);
        apiStatusElement.textContent = `API 연결 오류`;
        apiStatusElement.classList.add("api-error");
    }

    // 성공 / 정보 메시지 표시
    function displayInfo(message) {
        apiStatusElement.textContent = message;
        apiStatusElement.classList.add("api-success");
    }

    // 날짜 포맷팅
    function formatDateTime(isoString) {
        if (!isoString) return "";
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) {
                return "시간 정보 없음";
            }
            return date.toLocaleString("ko-KR");
        } catch (e) {
            console.error("날짜 포맷팅 오류:", isoString, e);
            return "시간 정보 오류";
        }
    }

    // API 상태 확인
    async function checkApiStatus() {
        try {
            // 로컬 테스트
            // const rootUrl = "http://localhost:8000";
            // const response = await fetch(`${rootUrl}`);

            // 배포
            const response = await fetch(`${API_URL}/health`);

            if (!response.ok) throw new Error("API 연결 실패");
            const data = await response.json();
            displayInfo(
                `API 상태: ${data.message}, DB 상태: ${data.database_status}`
            );
            return true;
        } catch (error) {
            displayError("API 연결 실패:", error);
            return false;
        }
    }

    // 단일 Todo 항목 <li> 요소 생성/업데이트 함수
    function createOrUpdateTodoElement(todo) {
        const todoId = todo.id;
        let todoItem = todoList.querySelector(
            `.todo-item[data-id="${todoId}"]`
        );

        // 새 항목이면 li 생성, 아니면 기존 li 사용
        if (!todoItem) {
            todoItem = document.createElement("li");
            todoItem.dataset.id = todoId;
            todoItem.classList.add("todo-item");
        }

        // 데이터셋 업데이트 (편집 취소 시 복구용)
        todoItem.dataset.title = todo.title;
        todoItem.dataset.description = todo.description || "";
        todoItem.dataset.completed = todo.completed; // 완료 상태 저장
        todoItem.dataset.createdAt = todo.created_at;
        todoItem.dataset.updatedAt = todo.updated_at;

        // 완료 상태에 따라 클래스 토글
        if (todo.completed) {
            todoItem.classList.add("completed");
        } else {
            todoItem.classList.remove("completed");
        }
        todoItem.classList.remove("editing"); // 항상 표시 모드로

        // innerHTML 설정 (표시 모드)
        todoItem.innerHTML = `
            <div class="todo-text">
                <h3 class="todo-title-display">${todo.title}</h3>
                ${
                    todo.description
                        ? `<p class="todo-description-display">${todo.description}</p>`
                        : ""
                }
                <input type="text" class="todo-title-input" value="${
                    todo.title
                }" style="display: none;">
                <textarea class="todo-description-input" style="display: none;">${
                    todo.description || ""
                }</textarea>
                <div class="todo-timestamps">
                    <span class="created-at">생성: ${formatDateTime(
                        todo.created_at
                    )}</span>
                    <span class="updated-at">수정: ${formatDateTime(
                        todo.updated_at
                    )}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="complete-btn action-btn">${
                    todo.completed ? "취소" : "완료"
                }</button>
                <button class="edit-btn action-btn">수정</button>
                <button class="delete-btn action-btn">삭제</button>
                <button class="save-btn action-btn" style="display: none;">저장</button>
                <button class="cancel-btn action-btn" style="display: none;">취소</button>
            </div>
        `;
        return todoItem; // 생성 또는 업데이트된 li 요소 반환
    }

    // 할 일 목록을 불러와서 화면에 표시하는 함수
    async function loadTodos() {
        if (!(await checkApiStatus())) return; // API 상태 먼저 확인

        try {
            const response = await fetch(`${API_URL}/todos`);
            if (!response.ok)
                throw new Error(`API 요청 실패: ${response.status}`);
            const todos = await response.json();

            todoList.innerHTML = ""; // 기존 목록 비우기 (최초 로딩 시)

            if (Array.isArray(todos) && todos.length > 0) {
                todos.forEach((todo) => {
                    const todoItem = createOrUpdateTodoElement(todo);
                    todoList.appendChild(todoItem);
                });
                emptyTodoMessage.style.display = "none";
            } else {
                emptyTodoMessage.style.display = "block"; // 목록 비었을 때 메시지 표시
            }
        } catch (error) {
            displayError("할 일 목록 불러오기 실패", error);
        }
    }

    // 새 할 일 추가 함수
    async function addTodo() {
        const title = todoInput.value.trim();
        const description = todoDescription.value.trim();
        if (!title) {
            alert("할 일을 입력해주세요!");
            return;
        }

        const newTodoData = { title, description }; // completed는 서버 기본값(false) 사용

        try {
            const response = await fetch(`${API_URL}/todos`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTodoData),
            });
            if (!response.ok)
                throw new Error(`API 요청 실패: ${response.status}`);
            const createdTodo = await response.json();

            // [개선 1] 전체 목록 새로고침 대신 새 항목만 추가
            const todoItem = createOrUpdateTodoElement(createdTodo);
            todoList.appendChild(todoItem);
            emptyTodoMessage.style.display = "none"; // 목록 있으니 메시지 숨김

            todoInput.value = ""; // 입력 필드 초기화
            todoDescription.value = "";
            displayInfo("추가되었습니다.");
        } catch (error) {
            displayError("추가 실패", error);
        }
    }

    // 할 일 업데이트 API 호출 함수 (완료 토글 및 내용 수정 공통 사용)
    async function updateTodoOnServer(todoId, updateData) {
        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData),
            });
            if (!response.ok)
                throw new Error(`API 업데이트 실패: ${response.status}`);
            const updatedTodo = await response.json();

            // [개선 1] 전체 목록 새로고침 대신 해당 항목만 업데이트
            createOrUpdateTodoElement(updatedTodo); // 기존 li 찾아서 내용 업데이트
            displayInfo("수정되었습니다.");
            return true; // 성공 여부 반환
        } catch (error) {
            displayError("수정 실패", error);
            return false;
        }
    }

    // 할 일 삭제 API 호출 함수
    async function deleteTodoOnServer(todoId) {
        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Delete failed");
            // const data = await response.json(); // 삭제 응답 본문은 보통 없음

            // [개선 1] 전체 목록 새로고침 대신 해당 항목만 삭제
            const todoItem = todoList.querySelector(
                `.todo-item[data-id="${todoId}"]`
            );
            if (todoItem) {
                todoItem.remove();
            }
            // 목록이 비었는지 확인 후 메시지 표시
            if (todoList.children.length === 0) {
                emptyTodoMessage.style.display = "block";
            }
            displayInfo("삭제되었습니다.");
            return true;
        } catch (error) {
            displayError("삭제 실패", error);
            alert("삭제 중 오류 발생"); // alert는 유지하거나 다른 방식으로 변경
            return false;
        }
    }

    // --- [개선 2] 이벤트 위임: todoList 에 이벤트 리스너 하나만 등록 ---
    todoList.addEventListener("click", (event) => {
        const target = event.target; // 클릭된 요소
        const todoItem = target.closest(".todo-item"); // 가장 가까운 부모 li 찾기
        if (!todoItem) return; // li 내부가 아니면 무시

        const todoId = todoItem.dataset.id;

        // 어떤 버튼이 눌렸는지 확인
        if (target.matches(".complete-btn")) {
            const isCompleted = todoItem.classList.contains("completed");
            const updateData = { completed: !isCompleted }; // 서버에 보낼 데이터
            updateTodoOnServer(todoId, updateData);
        } else if (target.matches(".edit-btn")) {
            switchToEditMode(todoItem);
        } else if (target.matches(".delete-btn")) {
            if (confirm("정말 삭제하시겠습니까?")) {
                deleteTodoOnServer(todoId);
            }
        } else if (target.matches(".save-btn")) {
            handleSave(todoItem);
        } else if (target.matches(".cancel-btn")) {
            switchToDisplayMode(todoItem); // 취소 시 표시 모드로 변경
        }
    });

    // 편집 모드로 전환하는 함수
    function switchToEditMode(todoItem) {
        if (!todoItem || todoItem.classList.contains("editing")) return;

        todoItem.classList.add("editing");

        // 표시 요소 숨기기, 입력 요소 보이기
        todoItem.querySelector(".todo-title-display").style.display = "none";
        const descDisplay = todoItem.querySelector(".todo-description-display");
        if (descDisplay) descDisplay.style.display = "none";

        todoItem.querySelector(".todo-title-input").style.display = "block";
        todoItem.querySelector(".todo-description-input").style.display =
            "block";

        // 기본 액션 버튼 숨기기, 편집 액션 버튼 보이기
        todoItem.querySelector(".complete-btn").style.display = "none";
        todoItem.querySelector(".edit-btn").style.display = "none";
        todoItem.querySelector(".delete-btn").style.display = "none";
        todoItem.querySelector(".save-btn").style.display = "inline-block";
        todoItem.querySelector(".cancel-btn").style.display = "inline-block";

        todoItem.querySelector(".todo-title-input").focus();
    }

    // 표시 모드로 전환하는 함수 (수정 저장 또는 취소 시)
    function switchToDisplayMode(todoItem) {
        if (!todoItem) return;

        // 편집 모드 클래스 제거하여 CSS로 제어
        todoItem.classList.remove("editing");

        // 스타일 직접 제어 대신 CSS 클래스에 맡김
        // 필요시 createOrUpdateTodoElement 를 다시 호출하여 내용을 완전히 다시 그릴 수도 있음
        const updatedTodoData = {
            id: todoItem.dataset.id,
            title: todoItem.dataset.title,
            description: todoItem.dataset.description,
            completed: todoItem.dataset.completed === "true", // boolean으로 변환
            created_at: todoItem.dataset.createdAt,
            updated_at: todoItem.dataset.updatedAt,
        };
        createOrUpdateTodoElement(updatedTodoData); // 데이터셋 기준으로 다시 렌더링
    }

    // 저장 버튼 처리 함수
    async function handleSave(todoItem) {
        if (!todoItem || !todoItem.classList.contains("editing")) return;

        const todoId = todoItem.dataset.id;
        const titleInput = todoItem.querySelector(".todo-title-input");
        const descriptionInput = todoItem.querySelector(
            ".todo-description-input"
        );
        const completed = todoItem.classList.contains("completed"); // 현재 완료 상태 가져오기

        const newTitle = titleInput.value.trim();
        const newDescription = descriptionInput.value.trim();

        if (!newTitle) {
            alert("제목은 비워둘 수 없습니다!");
            titleInput.focus();
            return;
        }

        const updateData = {
            title: newTitle,
            description: newDescription,
            completed: completed,
        };
        await updateTodoOnServer(todoId, updateData);
        // updateTodoOnServer 성공 시 내부적으로 createOrUpdateTodoElement가 호출되어 표시 모드로 전환됨
        // 실패 시에는 편집 모드가 유지될 수 있으므로, 필요하면 여기서도 switchToDisplayMode 호출 고려
    }

    // --- 초기화 실행 ---
    loadTodos(); // 페이지 로드 시 할 일 목록 불러오기

    // '추가' 버튼 이벤트 리스너 (이벤트 위임과 별개로 필요)
    addTodoButton.addEventListener("click", addTodo);
    // Enter 키로 추가 (선택 사항)
    todoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addTodo();
        }
    });
    todoDescription.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            // Shift+Enter는 줄바꿈 유지
            e.preventDefault(); // 기본 Enter 동작(줄바꿈) 방지
            addTodo();
        }
    });
});