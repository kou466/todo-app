// 모든 DOM 요소가 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
    // 필요한 DOM 요소들 가져오기
    const apiStatusElement = document.getElementById("apiStatus");
    const todoInput = document.getElementById("todoInput");
    const todoDescription = document.getElementById("todoDescription");
    const addTodoButton = document.getElementById("addTodo");
    const todoList = document.getElementById("todoList");

    // API 기본 URL (백엔드 서버 주소)
    const API_URL = "http://localhost:8000/api";

    // 1. 페이지 로드 시 API 연결 상태 확인
    checkApiStatus();

    // 2. 페이지 로드 시 할 일 목록 불러오기
    loadTodos();

    // 3. 추가 버튼 클릭 이벤트 리스너 등록
    addTodoButton.addEventListener("click", addTodo);

    // API 상태 확인 함수
    async function checkApiStatus() {
        try {
            // fetch 함수로 API 루트 엔드포인트에 GET 요청 보내기
            const response = await fetch(`${API_URL}`);
            const data = await response.json();

            // 응답이 성공적이면 상태 표시 업데이트
            apiStatusElement.textContent = `API 상태: ${data.message}`;
            apiStatusElement.classList.add("api-success");
        } catch (error) {
            // 오류 발생 시 에러 메시지 표시
            apiStatusElement.textContent =
                "Disconnected";
            apiStatusElement.classList.add("api-error");
            console.error("API 상태 확인 오류:", error);
        }
    }

    // 할 일 목록을 불러오는 함수
    async function loadTodos() {
        try {
            // /api/todos 엔드포인트에 GET 요청
            const response = await fetch(`${API_URL}/todos`);
            if (!response.ok) {
                throw new Error(
                    `API 요청 실패: ${response.status} ${response.statusText}`
                );
            }
            const data = await response.json();

            console.log("할 일 목록:", data); // 데이터 확인용

            if (Array.isArray(data)) {
                renderTodos(data); // 데이터 렌더링
            } else {
                console.error("API 응답 배열이 아닙니다:", data);
                // 필요 시 사용자에게 오류 메시지 표시
            }
        } catch (error) {
            console.error("할 일 목록 불러오기 오류:", error);
            // 필요 시 사용자에게 오류 메시지 표시 (예: apiStatusElement 업데이트)
            const apiStatusElement = document.getElementById("apiStatus");
            if (apiStatusElement) {
                apiStatusElement.textContent =
                    "목록을 불러오는 중 오류가 발생했습니다.";
                apiStatusElement.classList.add("api-error"); // className으로 기준 클래스 대체
            }
        }
    }

    // 새 할 일 추가 함수
    async function addTodo() {
        // 입력값 가져오기
        const title = todoInput.value.trim();
        const description = todoDescription.value.trim();

        // 제목이 비어있으면 함수 종료
        if (!title) {
            alert("할 일을 입력해주세요!");
            return;
        }

        // 할 일 객체 생성
        const newTodo = {
            title,
            description,
            completed: false,
        };

        try {
            // /api/todos 엔드포인트에 POST 요청
            const response = await fetch(`${API_URL}/todos`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newTodo),
            });

            const data = await response.json();
            console.log("할 일 추가 결과:", data);

            // 입력 필드 초기화
            todoInput.value = "";
            todoDescription.value = "";

            // 할 일 목록 다시 불러오기
            loadTodos();
        } catch (error) {
            console.error("할 일 추가 오류:", error);
        }
    }

    // 할 일 목록을 화면에 표시하는 함수
    function renderTodos(todos) {
        todoList.innerHTML = "";
        const emptyMessageElement = document.getElementById("emptyTodoMessage");

        if (!emptyMessageElement) {
            console.error("ID 'emptyTodoMessage' 요소를 찾을 수 없습니다.");
        } else if (todos.length === 0) {
            emptyMessageElement.style.display = "block";
        } else {
            emptyMessageElement.style.display = "none";
        }

        function formatDateTime(isoString) {
            /* ... 이전과 동일 ... */
            if (!isoString) return "";
            try {
                const date = new Date(isoString);
                if (isNaN(date.getTime())) {
                    console.warn("유효하지 않은 날짜 형식:", isoString);
                    return "시간 정보 없음";
                }
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const hours = String(date.getHours()).padStart(2, "0");
                const minutes = String(date.getMinutes()).padStart(2, "0");
                return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
            } catch (e) {
                console.error("날짜 포맷팅 오류:", isoString, e);
                return "시간 정보 오류";
            }
        }

        todos.forEach((todo) => {
            const todoItem = document.createElement("li");
            // data 속성에 원래 값 저장 (편집 취소 시 복구용)
            todoItem.dataset.id = todo.id;
            todoItem.dataset.title = todo.title;
            todoItem.dataset.description = todo.description || ""; // 설명 없을 시 빈 문자열

            // 초기 클래스 설정
            todoItem.className = `todo-item ${
                todo.completed ? "completed" : ""
            }`;

            // 기본 표시 내용 생성
            renderTodoItemContent(todoItem, todo, formatDateTime);

            todoList.appendChild(todoItem);
        });
    }

    // 할 일 항목의 내용을 렌더링하는 함수 (표시 모드)
    function renderTodoItemContent(todoItem, todo, formatDateTimeFn) {
        const todoId = todo.id;
        const title = todo.title;
        const description = todo.description || "";
        const completed = todo.completed;
        const createdAtFormatted = formatDateTimeFn(todo.created_at);
        const updatedAtFormatted = formatDateTimeFn(todo.updated_at);

        // 기존 내용 비우기
        todoItem.innerHTML = "";

        // 클래스 초기화 (혹시 editing 클래스가 있다면 제거)
        todoItem.classList.remove("editing");

        // innerHTML 설정 (표시 모드)
        todoItem.innerHTML = `
            <div class="todo-text">
                <h3 class="todo-title-display">${title}</h3>
                ${
                    description
                        ? `<p class="todo-description-display">${description}</p>`
                        : ""
                }
                <input type="text" class="todo-title-input" value="${title}" style="display: none;">
                <textarea class="todo-description-input" style="display: none;">${description}</textarea>
                <div class="todo-timestamps">
                    <span class="created-at">생성 시간: ${createdAtFormatted}</span>
                    <span class="updated-at">마지막 수정: ${updatedAtFormatted}</span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="complete-btn action-btn">${
                    completed ? "취소" : "완료"
                }</button>
                <button class="edit-btn action-btn">수정</button>
                <button class="delete-btn action-btn">삭제</button>
                <button class="save-btn action-btn" style="display: none;">저장</button>
                <button class="cancel-btn action-btn" style="display: none;">취소</button>
            </div>
        `;

        // 버튼 이벤트 리스너 다시 연결
        addEventListenersToTodoItem(todoItem, todoId);
    }

    // 할 일 항목에 이벤트 리스너 추가 함수
    function addEventListenersToTodoItem(todoItem, todoId) {
        const completeBtn = todoItem.querySelector(".complete-btn");
        const editBtn = todoItem.querySelector(".edit-btn");
        const deleteBtn = todoItem.querySelector(".delete-btn");
        const saveBtn = todoItem.querySelector(".save-btn");
        const cancelBtn = todoItem.querySelector(".cancel-btn");

        if (completeBtn) {
            completeBtn.addEventListener("click", () => {
                const isCompleted = todoItem.classList.contains("completed");
                toggleTodoComplete(todoId, !isCompleted); // 상태 토글
            });
        }
        if (editBtn) {
            editBtn.addEventListener("click", () => handleEdit(todoId)); // ID만 전달
        }
        if (deleteBtn) {
            deleteBtn.addEventListener("click", () => deleteTodo(todoId));
        }
        if (saveBtn) {
            saveBtn.addEventListener("click", () => handleSave(todoId));
        }
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => handleCancel(todoId));
        }
    }

    // 수정 버튼 클릭 시 -> 편집 모드로 전환
    function handleEdit(todoId) {
        const todoItem = document.querySelector(
            `.todo-item[data-id="${todoId}"]`
        );
        if (!todoItem || todoItem.classList.contains("editing")) return; // 이미 편집 중이면 무시

        todoItem.classList.add("editing"); // 편집 모드 클래스 추가

        // 표시 요소 숨기기
        const titleDisplay = todoItem.querySelector(".todo-title-display");
        const descriptionDisplay = todoItem.querySelector(
            ".todo-description-display"
        );
        if (titleDisplay) titleDisplay.style.display = "none";
        if (descriptionDisplay) descriptionDisplay.style.display = "none";

        // 입력 요소 보이기
        const titleInput = todoItem.querySelector(".todo-title-input");
        const descriptionInput = todoItem.querySelector(
            ".todo-description-input"
        );
        if (titleInput) titleInput.style.display = "block";
        if (descriptionInput) descriptionInput.style.display = "block";

        // 기본 액션 버튼 숨기기
        todoItem.querySelector(".complete-btn").style.display = "none";
        todoItem.querySelector(".edit-btn").style.display = "none";
        todoItem.querySelector(".delete-btn").style.display = "none";

        // 편집 액션 버튼 보이기
        todoItem.querySelector(".save-btn").style.display = "inline-block";
        todoItem.querySelector(".cancel-btn").style.display = "inline-block";

        if (titleInput) titleInput.focus(); // 제목 입력 필드에 포커스
    }

    // 저장 버튼 클릭 시 -> 변경사항 저장
    async function handleSave(todoId) {
        const todoItem = document.querySelector(
            `.todo-item[data-id="${todoId}"]`
        );
        if (!todoItem || !todoItem.classList.contains("editing")) return;

        const titleInput = todoItem.querySelector(".todo-title-input");
        const descriptionInput = todoItem.querySelector(
            ".todo-description-input"
        );

        const newTitle = titleInput
            ? titleInput.value.trim()
            : todoItem.dataset.title; // 입력 필드 없으면 원래 값
        const newDescription = descriptionInput
            ? descriptionInput.value.trim()
            : todoItem.dataset.description;
        const isCompleted = todoItem.classList.contains("completed"); // 현재 완료 상태 유지

        if (!newTitle) {
            alert("제목은 비워둘 수 없습니다!");
            titleInput.focus();
            return;
        }

        // API 호출하여 업데이트
        await updateTodoItem(todoId, newTitle, newDescription, isCompleted);
        // 성공 여부와 관계없이 loadTodos가 목록을 다시 그리므로 편집 모드 해제됨
    }

    // 취소 버튼 클릭 시 -> 표시 모드로 복구
    function handleCancel(todoId) {
        const todoItem = document.querySelector(
            `.todo-item[data-id="${todoId}"]`
        );
        if (!todoItem || !todoItem.classList.contains("editing")) return;

        // 간단하게 전체 목록을 다시 로드하여 원래 상태로 복구
        // (개별 항목 복구 로직보다 구현이 쉬움)
        // 개별 항목 복구: 입력 필드 숨기고, 표시 요소 보이고, 버튼 토글
        // renderTodoItemContent(todoItem, {id: todoId, title: todoItem.dataset.title, description: todoItem.dataset.description, completed: todoItem.classList.contains('completed'), created_at: '...', updated_at: '...'}, formatDateTime); // 시간 정보 다시 가져와야 함

        // 임시: 전체 목록 새로고침으로 복구
        loadTodos();
    }

    // 할 일 업데이트 API 호출 함수
    async function updateTodoItem(todoId, title, description, completed) {
        const updatedTodo = { title, description, completed };

        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedTodo),
            });

            if (!response.ok) {
                throw new Error(
                    `API 업데이트 실패: ${response.status} ${response.statusText}`
                );
            }
            const data = await response.json();
            console.log("할 일 업데이트 결과:", data);
            loadTodos(); // 목록 새로고침 (성공 시)
        } catch (error) {
            console.error("할 일 업데이트 오류:", error);
            alert("할 일 업데이트 중 오류가 발생했습니다.");
            // 오류 발생 시에도 목록을 다시 로드하여 편집 모드 해제 (선택적)
            // loadTodos();
        }
    }

    // 할 일 완료 상태 토글 함수 (updateTodoItem 사용하도록 수정 가능)
    async function toggleTodoComplete(todoId, completed) {
        // 기존 방식 유지 또는 updateTodoItem 사용
        // updateTodoItem 사용 예시:
        const todoItem = document.querySelector(
            `.todo-item[data-id="${todoId}"]`
        );
        if (!todoItem) return;
        const title = todoItem.dataset.title; // data 속성에서 가져오기
        const description = todoItem.dataset.description;
        await updateTodoItem(todoId, title, description, completed);

        /* // 기존 방식:
        try {
            const todoItem = document.querySelector(`.todo-item[data-id="${todoId}"]`);
            const todoTitle = todoItem.querySelector('.todo-title-display')?.textContent || todoItem.dataset.title;
            const todoDescription = todoItem.querySelector('.todo-description-display')?.textContent || todoItem.dataset.description;

            const updatedTodo = {
                title: todoTitle,
                description: todoDescription,
                completed: completed,
            };
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedTodo),
            });
            if (!response.ok) throw new Error('Update failed');
            const data = await response.json();
            console.log("할 일 업데이트 결과:", data);
            loadTodos();
        } catch (error) {
            console.error("할 일 상태 변경 오류:", error);
        }
        */
    }

    // 할 일 삭제 함수
    async function deleteTodo(todoId) {
        // ... 이전과 동일 ...
        if (!confirm("삭제하시겠습니까?")) return;
        try {
            const response = await fetch(`${API_URL}/todos/${todoId}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Delete failed");
            const data = await response.json();
            console.log("할 일 삭제 결과:", data);
            loadTodos();
        } catch (error) {
            console.error("할 일 삭제 오류:", error);
            alert("삭제 중 오류 발생");
        }
    }
});
