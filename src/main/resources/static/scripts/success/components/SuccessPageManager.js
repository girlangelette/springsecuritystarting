import SuccessPageConfigurer from "./SuccessPageConfigurer.js";
import SuccessPagePostRequestsExecutor from "./SuccessPagePostRequestsExecutor.js";
import SuccessPageDataResolver from "./SuccessPageDataResolver.js";
import CommonGetRequestsExecutor from "../../common/CommonGetRequestsExecutor.js";
import SuccessPageAdminPostRequestsExecutor from "./SuccessPageAdminPostRequestsExecutor.js";
import Verifier from "../../common/Verifier.js";
import {ALERT_WRONG_USERNAME_INPUT} from "../../common/Constants.js";

/**
 * A manager for <pre> success </pre> page.
 */
export default class SuccessPageManager {

    successPageConfigurer;
    successPagePostRequestExecutor;
    successPageDataResolver;
    commonGetRequestsExecutor;
    successPageAdminPostRequestExecutor;

    constructor() {
        this.successPageConfigurer = new SuccessPageConfigurer();
        this.successPagePostRequestExecutor = new SuccessPagePostRequestsExecutor();
        this.successPageDataResolver = new SuccessPageDataResolver();
        this.commonGetRequestsExecutor = new CommonGetRequestsExecutor();
        this.successPageAdminPostRequestExecutor = new SuccessPageAdminPostRequestsExecutor();
    }

    /* A constant, which will be displayed in case of wrong row data input. */
    WRONG_ROW_DATA_INPUT = 'Something inputted wrong - time should be type of HH:MM and agenda should not be empty';

    /* A row's state before editing it(before clicking <pre> "edit" </pre> button). */
    rowDataBeforeUpdate;

    onEditButtonClicked(agendaId, editButton) {
        if ($(editButton).text().toLowerCase() === "edit") {
            /* Set state to <pre> rowDataBeforeUpdate </pre> before clicking <pre> "edit" </pre> button. */
            this.rowDataBeforeUpdate = this.successPageDataResolver
                .resolveDataFromNonContentEditableRowCorrespondingToSpecificButton(editButton);

            /* Do some <pre> DOM </pre> elements configurations after clicking <pre> "edit" </pre> button. */
            this.successPageConfigurer
                .configureOnEditButtonClicked(editButton);
        } else {
            /* Resolve row data after clicking <pre> "edit" </pre> button. */
            let newRowData = this.successPageDataResolver
                .resolveDataFromContentEditableRowCorrespondingToSpecificButton(editButton);

            /* Try to verify newly-inputted row data. */
            try {
                Verifier.verifyRowData(newRowData);
            } catch (e) {
                alert(this.WRONG_ROW_DATA_INPUT);
                /* If an error occurred during verification - set old data to this row. */
                this.successPageConfigurer.setRowData(editButton, this.rowDataBeforeUpdate);
                return;
            }

            /* In order to reduce the load on the server, we check, if a <pre> POST </pre> request
             * really needed to be executed.
             * Of course, there is no need to execute a POST request if we didn't anything. */
            if (this.rowDataBeforeUpdate.equals(newRowData)) {
                alert('No update needed - you changed nothing!');
                this.successPageConfigurer.setRowData(editButton, newRowData);
                return;
            }

            /* if everything is fine, execute an update POST request. */
            this.successPagePostRequestExecutor
                .executeUpdateAgendaByItsIdPostRequest(agendaId, newRowData)
                /* If the <pre> POST </pre> request proceeded normally, then... */
                .done((response) => {
                        /* ...alert the response message and set just inputted data to the row. */
                        alert(response);
                        this.successPageConfigurer.setRowData(editButton, newRowData);
                    }
                )
                /* If the <pre> POST </pre> request fails, then... */
                .fail((response) => {
                        /* ...alert the response message and set just inputted data to the row. */
                        alert(response.responseText);
                        this.successPageConfigurer.setRowData(editButton, this.rowDataBeforeUpdate);
                    }
                );
        }
    }

    onDeleteButtonClicked(agendaId, deleteButton) {
        this.successPagePostRequestExecutor
            .executeDeleteAgendaByItsIdPostRequest(agendaId, deleteButton)
            /* If the <pre> POST </pre> request proceeded normally, then... */
            .done((response) => {
                    /* ...alert the response message and delete the row. */
                    alert(response);
                    this.successPageConfigurer.deleteRowFromTable(deleteButton);
                }
            )
            /* If the <pre> POST </pre> request fails, then... */
            .fail((response) => {
                /* ...else, <pre> response </pre> gets wrapped into the <pre> jqHXR </pre> object,
                 * and we just alert the <pre> responseText </pre>. */
                    alert(response.responseText);
                }
            );
    }

    onAddButtonClicked(username) {
        /* Add a new (pre-configured) row to the table. */
        const saveButtonInLastRow = this.successPageConfigurer.addRowToTable();

        /* Set a function to the <pre> "save" </pre> button -
         * it should execute a <pre> '/saveNewAgenda' </pre> post request. */
        saveButtonInLastRow.click(() => {
                /* Resolve row data from last row... */
                const rowData = this.successPageDataResolver
                    .resolveDataFromContentEditableRowCorrespondingToSpecificButton(saveButtonInLastRow);

                /* ...verify it... */
                try {
                    Verifier.verifyRowData(rowData);
                } catch (e) {
                    /* If an error occurred during verification, alert a message and return. */
                    alert(this.WRONG_ROW_DATA_INPUT);
                    return;
                }

                /* ...if row data is verified, we can save it, so, we execute a
                 * <pre> '/saveNewAgenda' </pre> <pre> POST </pre> request. */
                this.successPagePostRequestExecutor
                    .executeSaveNewAgendaPostRequest(username, rowData)
                    /* If the <pre> POST </pre> request proceeded normally, then... */
                    .done((response) => {
                            /* ...alert the response message and save new row to the table. */
                            alert(response);
                            this.successPageConfigurer
                                .afterSuccessfullySavingNewAgenda(saveButtonInLastRow, rowData);
                        }
                    )
                    /* ...else, <pre> response </pre> gets wrapped into the <pre> jqHXR </pre> object,
                     * and we just alert the <pre> responseText </pre>. */
                    .fail(function (response) {
                            alert(response.responseText);
                        }
                    );
            }
        )
    }

    onSearchButtonClicked() {
        /* Resolve username for searching agenda... */
        const usernameForSearchingAgenda = this.successPageDataResolver
            .resolveUsernameForSearchingAgendas();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForSearchingAgenda);
        } catch (e) {
            /* If an error occurred during verification, alert a message and return. */
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre>'/search'</pre> <pre> GET </pre> request. */
        this.commonGetRequestsExecutor
            .executeSearchSomeOnesAgendaGetRequest(usernameForSearchingAgenda);
    }

    onAdminBanButtonClicked() {
        /* Resolve username for banning... */
        const usernameForBanning = this.successPageDataResolver
            .resolveUsernameForBanningOrUnbanning();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForBanning);
        } catch (e) {
            /* If an error occurred during verification, alert a message and return. */
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre> '/ban' </pre> <pre> POST </pre> request. */
        this.successPageAdminPostRequestExecutor
            .executeBanUserPostRequest(usernameForBanning)
            /* If this request was processed, then we just alert <pre> response </pre>,... */
            .done(function (response) {
                    alert(response);
                }
            )
            /* ...else, <pre> response </pre> gets wrapped into the <pre> jqHXR </pre> object,
             * and we just alert the <pre> responseText </pre>. */
            .fail(function (response) {
                    alert(response.responseText);
                }
            );

    }

    onAdminUnbanButtonClicked() {
        /* Resolve username for unbanning... */
        const usernameForUnbanning = this.successPageDataResolver
            .resolveUsernameForBanningOrUnbanning();

        /* ...try to verify it... */
        try {
            Verifier.verifyUsername(usernameForUnbanning);
        } catch (e) {
            alert(ALERT_WRONG_USERNAME_INPUT);
            return;
        }

        /* ...if username is verified, the execute <pre> '/unban' </pre> <pre> POST </pre> request. */
        this.successPageAdminPostRequestExecutor
            .executeUnbanUserPostRequest(usernameForUnbanning)
            /* If this request was processed, then we just alert <pre> response </pre>,... */
            .done(function (response) {
                    alert(response);
                }
            )
            /* ...else, <pre> response </pre> gets wrapped into the <pre> jqHXR </pre> object,
             * and we just alert the <pre> responseText </pre>. */
            .fail(function (response) {
                    alert(response.responseText);
                }
            );
    }
}